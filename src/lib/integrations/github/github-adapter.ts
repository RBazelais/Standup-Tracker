// src/lib/integrations/github/github-adapter.ts

import { Octokit } from '@octokit/rest';
import type {
	Task,
	TaskStatus,
	TaskPriority,
	ExternalTaskCache,
	TaskExternalLink,
} from '@/types';

/**
 * GitHub Issues Adapter
 *
 * Handles all GitHub Issues API interactions and normalization
 * to our unified Task schema.
 */

// TYPES

export interface GitHubIssue {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: 'open' | 'closed';
	html_url: string;
	labels: Array<{
		id: number;
		name: string;
		color: string;
	}>;
	milestone: {
		id: number;
		number: number;
		title: string;
		due_on: string | null;
		state: 'open' | 'closed';
	} | null;
	assignee: {
		login: string;
		avatar_url: string;
	} | null;
	created_at: string;
	updated_at: string;
	closed_at: string | null;
}

export interface ParsedIssueRef {
	owner: string;
	repo: string;
	number: number;
	raw: string;
}

// GITHUB ADAPTER CLASS
export class GitHubAdapter {
	private octokit: Octokit;
	private readonly defaultOwner: string;
	private readonly defaultRepo: string;

	constructor(accessToken: string, defaultOwner: string, defaultRepo: string) {
		this.octokit = new Octokit({ auth: accessToken });
		this.defaultOwner = defaultOwner;
		this.defaultRepo = defaultRepo;
	}

	getRepositoryContext() {
		return { owner: this.defaultOwner, repo: this.defaultRepo };
	}

	/**
	 * Parse commit messages for issue references.
	 */
	parseIssueRefs(commits: Array<{ message: string }>): ParsedIssueRef[] {
		const refs: ParsedIssueRef[] = [];
		const seen = new Set<string>();

		const patterns = [
			/(?<owner>[\w.-]+)\/(?<repo>[\w.-]+)#(?<number>\d+)/g,
			/GH-(?<number>\d+)/gi,
			/(?:fix(?:es)?|close[sd]?|resolve[sd]?)\s+#(?<number>\d+)/gi,
			/(?<!&)#(?<number>\d+)/g,
		];

		for (const commit of commits) {
			for (const pattern of patterns) {
				pattern.lastIndex = 0;

				let match: RegExpExecArray | null;
				while ((match = pattern.exec(commit.message)) !== null) {
					const owner = match.groups?.owner || this.defaultOwner;
					const repo = match.groups?.repo || this.defaultRepo;
					const number = Number.parseInt(match.groups?.number || '', 10);
					const key = `${owner}/${repo}#${number}`;

					if (!Number.isFinite(number) || number <= 0) continue;

					if (!seen.has(key)) {
						seen.add(key);
						refs.push({
							owner,
							repo,
							number,
							raw: match[0],
						});
					}
				}
			}
		}

		return refs;
	}

	async getIssue(owner: string, repo: string, number: number): Promise<GitHubIssue | null> {
		try {
			const { data } = await this.octokit.issues.get({
				owner,
				repo,
				issue_number: number,
			});

			return data as GitHubIssue;
		} catch (error: unknown) {
			if (
				typeof error === 'object' &&
				error !== null &&
				'status' in error &&
				(error as { status?: number }).status === 404
			) {
				return null;
			}
			throw error;
		}
	}

	async searchIssues(options: {
		owner?: string;
		repo?: string;
		query?: string;
		state?: 'open' | 'closed' | 'all';
		labels?: string[];
		milestone?: number | 'none' | '*';
		assignee?: string;
		limit?: number;
	}): Promise<GitHubIssue[]> {
		const owner = options.owner || this.defaultOwner;
		const repo = options.repo || this.defaultRepo;

		const { data } = await this.octokit.issues.listForRepo({
			owner,
			repo,
			state: options.state || 'open',
			labels: options.labels?.join(','),
			milestone: options.milestone?.toString(),
			assignee: options.assignee,
			per_page: options.limit || 20,
			sort: 'updated',
			direction: 'desc',
		});

		const filtered = data.filter(issue => !('pull_request' in issue));

		if (!options.query?.trim()) {
			return filtered as GitHubIssue[];
		}

		const q = options.query.toLowerCase().trim();
		return (filtered as GitHubIssue[]).filter(issue => {
			return (
				issue.title.toLowerCase().includes(q) ||
				issue.number.toString() === q.replace('#', '') ||
				(issue.body || '').toLowerCase().includes(q)
			);
		});
	}

	async getIssues(refs: ParsedIssueRef[]): Promise<Map<string, GitHubIssue | null>> {
		const results = new Map<string, GitHubIssue | null>();
		const byRepo = new Map<string, ParsedIssueRef[]>();

		for (const ref of refs) {
			const key = `${ref.owner}/${ref.repo}`;
			if (!byRepo.has(key)) {
				byRepo.set(key, []);
			}
			byRepo.get(key)?.push(ref);
		}

		for (const [repoKey, repoRefs] of byRepo) {
			const [owner, repo] = repoKey.split('/');

			await Promise.all(
				repoRefs.map(async (ref) => {
					const issue = await this.getIssue(owner, repo, ref.number);
					results.set(`${owner}/${repo}#${ref.number}`, issue);
				})
			);
		}

		return results;
	}

	normalizeToTask(issue: GitHubIssue, owner: string, repo: string): {
		task: Partial<Task>;
		cache: ExternalTaskCache;
		link: TaskExternalLink;
	} {
		const externalId = `#${issue.number}`;
		const source = 'github' as const;
		const status = this.mapStatus(issue);
		const priority = this.extractPriority(issue.labels);
		const storyPoints = this.extractStoryPoints(issue.labels);

		const task: Partial<Task> = {
			title: issue.title,
			description: issue.body || '',
			status,
			priority,
			storyPoints,
			externalId,
			externalSource: source,
			externalUrl: issue.html_url,
		};

		const cache: ExternalTaskCache = {
			externalId,
			source,
			externalUrl: issue.html_url,
			title: issue.title,
			description: issue.body || undefined,
			status: issue.state,
			storyPoints,
			priority,
			sprintExternalId: issue.milestone?.number.toString() || null,
			rawData: issue,
			syncedAt: new Date(),
		};

		const link: TaskExternalLink = {
			externalId,
			source,
			externalUrl: issue.html_url,
			confidence: 'explicit',
		};

		void owner;
		void repo;
		return { task, cache, link };
	}

	private mapStatus(issue: GitHubIssue): TaskStatus {
		if (issue.state === 'closed') {
			return 'done';
		}

		const labelNames = issue.labels.map(label => label.name.toLowerCase());

		if (labelNames.some(label => label.includes('in progress') || label.includes('wip'))) {
			return 'in_progress';
		}

		if (
			labelNames.some(
				label =>
					label === 'pr' ||
					label.includes('review') ||
					label.includes('pull request')
			)
		) {
			return 'in_review';
		}

		if (labelNames.some(label => label.includes('blocked'))) {
			return 'blocked';
		}

		if (labelNames.some(label => label.includes('backlog'))) {
			return 'backlog';
		}

		return 'planned';
	}

	private extractPriority(labels: GitHubIssue['labels']): TaskPriority {
		const labelNames = labels.map(label => label.name.toLowerCase());

		if (labelNames.some(label => label.includes('priority:critical') || label.includes('p0'))) {
			return 'urgent';
		}
		if (labelNames.some(label => label.includes('priority:high') || label.includes('p1'))) {
			return 'high';
		}
		if (labelNames.some(label => label.includes('priority:medium') || label.includes('p2'))) {
			return 'medium';
		}
		if (labelNames.some(label => label.includes('priority:low') || label.includes('p3'))) {
			return 'low';
		}
		if (labelNames.some(label => label === 'bug' || label === 'security')) {
			return 'high';
		}

		return 'none';
	}

	private extractStoryPoints(labels: GitHubIssue['labels']): number | null {
		const sizeMap: Record<string, number> = {
			xxs: 1,
			xs: 1,
			s: 2,
			small: 2,
			m: 3,
			medium: 3,
			l: 5,
			large: 5,
			xl: 8,
			xlarge: 8,
			xxl: 13,
		};

		for (const label of labels) {
			const name = label.name.toLowerCase();

			const pointsMatch = name.match(/(?:points?|sp|estimate)[:\s]?(\d+)/);
			if (pointsMatch?.[1]) {
				return Number.parseInt(pointsMatch[1], 10);
			}

			const sizeMatch = name.match(/(?:size)[:\s]?(\w+)/);
			if (sizeMatch?.[1] && sizeMap[sizeMatch[1]]) {
				return sizeMap[sizeMatch[1]];
			}

			if (sizeMap[name]) {
				return sizeMap[name];
			}
		}

		return null;
	}

	async getMilestone(owner: string, repo: string, number: number) {
		try {
			const { data } = await this.octokit.issues.getMilestone({
				owner,
				repo,
				milestone_number: number,
			});

			return {
				externalId: number.toString(),
				source: 'github' as const,
				name: data.title,
				startDate: null,
				endDate: data.due_on ? new Date(data.due_on) : null,
				status: data.state === 'open' ? 'active' : 'completed',
			};
		} catch {
			return null;
		}
	}

	async listMilestones(owner: string, repo: string) {
		const { data } = await this.octokit.issues.listMilestones({
			owner,
			repo,
			state: 'open',
			sort: 'due_on',
			direction: 'asc',
		});

		return data.map(milestone => ({
			externalId: milestone.number.toString(),
			source: 'github' as const,
			name: milestone.title,
			startDate: null,
			endDate: milestone.due_on ? new Date(milestone.due_on) : null,
			status: milestone.state === 'open' ? 'active' : 'completed',
			openIssues: milestone.open_issues,
			closedIssues: milestone.closed_issues,
		}));
	}
}

export function createGitHubAdapter(
	accessToken: string,
	repoFullName: string
): GitHubAdapter {
	const [owner, repo] = repoFullName.split('/');
	return new GitHubAdapter(accessToken, owner, repo);
}
