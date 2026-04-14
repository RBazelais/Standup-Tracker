import { createGitHubAdapter, type GitHubAdapter, type GitHubIssue } from './integrations/github-adapter.js';
import type { Task, Standup, ExternalTaskCache, ExternalSource } from './types.js';

interface DetectedTask {
	externalId: string;
	source: ExternalSource;
	confidence: 'explicit' | 'inferred';
	raw: string;
	resolved?: Task;
	error?: string;
}

interface LinkingResult {
	detected: DetectedTask[];
	resolved: Task[];
	suggested: Task[];
	autoLinked: Task[];
	errors: Array<{ externalId: string; error: string }>;
}

interface DatabaseClient {
	integrations: {
		findOne: (query: { userId: string; source: 'github' }) => Promise<{ accessToken: string } | null>;
	};
	externalTaskCache: {
		findOne: (query: { externalId: string; source: ExternalSource }) => Promise<ExternalTaskCache | null>;
		upsert: (payload: ExternalTaskCache) => Promise<void>;
	};
	tasks: {
		findByExternalLink: (query: { externalId: string; source: ExternalSource }) => Promise<Task | null>;
		update: (taskId: string, payload: Partial<Task>) => Promise<void>;
		create: (payload: Omit<Partial<Task>, 'id'> & { userId: string; createdAt: Date; updatedAt: Date }) => Promise<Task>;
		findOne: (query: { id: string }) => Promise<Task | null>;
	};
	taskExternalLinks: {
		create: (payload: {
			taskId: string;
			externalId: string;
			source: ExternalSource;
			externalUrl?: string;
			confidence: 'explicit' | 'inferred';
		}) => Promise<void>;
		findOne: (query: { externalId: string; source: ExternalSource }) => Promise<{ taskId: string } | null>;
	};
	sprints: {
		findOne: (query: {
			externalId: string;
			source: 'github';
			userId: string;
		}) => Promise<{ id: string } | null>;
		create: (payload: {
			userId: string;
			externalId: string;
			source: 'github';
			name: string;
			startDate: Date | null;
			endDate: Date | null;
			status: 'active';
		}) => Promise<{ id: string }>;
	};
	standupTasks: {
		create: (payload: {
			standupId: string;
			taskId: string;
			snapshotSprintId: string | null;
			snapshotStatus: string | null;
			linkedAt: Date;
		}) => Promise<void>;
	};
}

export class TaskLinkingService {
	private db: DatabaseClient;
	private githubAdapter: GitHubAdapter | null = null;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	async initializeAdapters(userId: string, repoFullName: string) {
		const integration = await this.db.integrations.findOne({
			userId,
			source: 'github',
		});

		if (integration) {
			this.githubAdapter = createGitHubAdapter(integration.accessToken, repoFullName);
		}
	}

	async detectAndResolveTasks(standup: Partial<Standup>, userId: string): Promise<LinkingResult> {
		const result: LinkingResult = {
			detected: [],
			resolved: [],
			suggested: [],
			autoLinked: [],
			errors: [],
		};

		if (!this.githubAdapter && standup.repoFullName) {
			await this.initializeAdapters(userId, standup.repoFullName);
		}

		if (standup.commits?.length && this.githubAdapter) {
			const refs = this.githubAdapter.parseIssueRefs(
				standup.commits.map(commit => ({ message: commit.commit.message }))
			);

			for (const ref of refs) {
				result.detected.push({
					externalId: `#${ref.number}`,
					source: 'github',
					confidence: this.determineConfidence(ref.raw),
					raw: ref.raw,
				});
			}
		}

		for (const detected of result.detected) {
			try {
				const task = await this.resolveTask(detected, userId);
				if (!task) {
					continue;
				}

				detected.resolved = task;
				result.resolved.push(task);

				if (detected.confidence === 'explicit') {
					result.autoLinked.push(task);
				} else {
					result.suggested.push(task);
				}
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Unknown task resolution error';
				detected.error = message;
				result.errors.push({
					externalId: detected.externalId,
					error: message,
				});
			}
		}

		return result;
	}

	private determineConfidence(raw: string): 'explicit' | 'inferred' {
		if (/^(fix(es)?|close[sd]?|resolve[sd]?)\s+/i.test(raw)) {
			return 'explicit';
		}
		return 'inferred';
	}

	private async resolveTask(detected: DetectedTask, userId: string): Promise<Task | null> {
		const cached = await this.db.externalTaskCache.findOne({
			externalId: detected.externalId,
			source: detected.source,
		});

		if (cached && !this.isStale(cached.syncedAt)) {
			return this.cacheToTask(cached);
		}

		if (detected.source === 'github' && this.githubAdapter) {
			const number = Number.parseInt(detected.externalId.replace('#', ''), 10);
			const { owner, repo } = this.githubAdapter.getRepositoryContext();
			const issue = await this.githubAdapter.getIssue(owner, repo, number);

			if (!issue) {
				throw new Error(`Issue ${detected.externalId} not found`);
			}

			const { task, cache, link } = this.githubAdapter.normalizeToTask(issue, owner, repo);

			await this.db.externalTaskCache.upsert({
				...cache,
				externalId: detected.externalId,
				source: 'github',
			});

			const existingTask = await this.db.tasks.findByExternalLink({
				externalId: detected.externalId,
				source: 'github',
			});

			if (existingTask) {
				await this.db.tasks.update(existingTask.id, {
					...task,
					updatedAt: new Date(),
				});
				return {
					...existingTask,
					...task,
					externalLinks: existingTask.externalLinks || [link],
				};
			}

			const now = new Date();
			const newTask = await this.db.tasks.create({
				...task,
				userId,
				firstSprintId: null,
				rolloverCount: 0,
				totalSprintsTouched: 0,
				createdAt: now,
				updatedAt: now,
			});

			await this.db.taskExternalLinks.create({
				taskId: newTask.id,
				...link,
				confidence: detected.confidence,
			});

			if (issue.milestone) {
				await this.linkMilestoneToSprint(newTask.id, issue.milestone, userId);
			}

			return {
				...newTask,
				externalLinks: [
					{
						...link,
						taskId: newTask.id,
					},
				],
			};
		}

		return null;
	}

	private async linkMilestoneToSprint(
		taskId: string,
		milestone: NonNullable<GitHubIssue['milestone']>,
		userId: string
	) {
		let sprint = await this.db.sprints.findOne({
			externalId: milestone.number.toString(),
			source: 'github',
			userId,
		});

		if (!sprint) {
			sprint = await this.db.sprints.create({
				userId,
				externalId: milestone.number.toString(),
				source: 'github',
				name: milestone.title,
				startDate: null,
				endDate: milestone.due_on ? new Date(milestone.due_on) : null,
				status: 'active',
			});
		}

		await this.db.tasks.update(taskId, {
			currentSprintId: sprint.id,
			updatedAt: new Date(),
		});
	}

	private isStale(syncedAt: Date): boolean {
		const oneHourMs = 60 * 60 * 1000;
		return Date.now() - syncedAt.getTime() > oneHourMs;
	}

	private async cacheToTask(cache: ExternalTaskCache): Promise<Task> {
		const link = await this.db.taskExternalLinks.findOne({
			externalId: cache.externalId,
			source: cache.source,
		});

		if (!link) {
			throw new Error('Cache exists but no linked task');
		}

		const task = await this.db.tasks.findOne({ id: link.taskId });
		if (!task) {
			throw new Error('Linked task not found for cache entry');
		}

		return task;
	}

	async searchTasks(
		query: string,
		source: ExternalSource,
		options: {
			state?: 'open' | 'closed' | 'all';
			milestone?: string;
			limit?: number;
		} = {}
	): Promise<Task[]> {
		if (source !== 'github' || !this.githubAdapter) {
			return [];
		}

		const adapter = this.githubAdapter;

		const issues = await adapter.searchIssues({
			query,
			state: options.state || 'open',
			milestone: options.milestone ? Number.parseInt(options.milestone, 10) : undefined,
			limit: options.limit || 20,
		});

		const { owner, repo } = adapter.getRepositoryContext();
		return issues.map(issue => {
			const { task } = adapter.normalizeToTask(issue, owner, repo);
			const now = new Date();
			return {
				// Temporary client-only identifier for unpersisted search results.
				id: `temp-${issue.number}`,
				title: task.title || issue.title,
				description: task.description || issue.body || '',
				status: task.status || 'planned',
				storyPoints: task.storyPoints,
				priority: task.priority,
				externalId: `#${issue.number}`,
				externalSource: 'github',
				externalUrl: issue.html_url,
				externalLinks: [
					{
						externalId: `#${issue.number}`,
						source: 'github',
						externalUrl: issue.html_url,
						confidence: 'explicit',
					},
				],
				createdAt: now,
				updatedAt: now,
			} as Task;
		});
	}

	async linkTasksToStandup(standupId: string, taskIds: string[], snapshotSprintId?: string) {
		for (const taskId of taskIds) {
			const task = await this.db.tasks.findOne({ id: taskId });
			if (!task) {
				console.warn(`Task ${taskId} not found, skipping link`);
				continue;
			}

			await this.db.standupTasks.create({
				standupId,
				taskId,
				snapshotSprintId: snapshotSprintId || task.currentSprintId || null,
				snapshotStatus: task.status || null,
				linkedAt: new Date(),
			});
		}
	}
}

export function createTaskLinkingService(db: DatabaseClient): TaskLinkingService {
	return new TaskLinkingService(db);
}
