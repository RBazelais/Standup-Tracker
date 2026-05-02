import type { JiraClient } from './jira-client.js';
import type {
	Task,
	TaskStatus,
	TaskPriority,
	ExternalTaskCache,
	TaskExternalLink,
} from '../types.js';

// TYPES

export interface JiraIssue {
	id: string;
	key: string;
	fields: {
		summary: string;
		description: JiraAdfNode | null;
		status: {
			name: string;
			statusCategory: {
				key: 'new' | 'indeterminate' | 'done';
			};
		};
		priority: {
			name: string;
		} | null;
		assignee: {
			displayName: string;
			accountId: string;
		} | null;
		labels: string[];
		customfield_10016?: number | null;
		created: string;
		updated: string;
	};
}

interface JiraAdfNode {
	type: string;
	content?: JiraAdfNode[];
	text?: string;
}

interface JiraSearchResponse {
	issues: JiraIssue[];
	total: number;
}

const JIRA_FIELDS = 'summary,description,status,priority,assignee,labels,customfield_10016,created,updated';

function extractText(node: JiraAdfNode | null): string {
	if (!node) return '';
	if (node.text) return node.text;
	if (!node.content) return '';
	return node.content.map(extractText).join('');
}

// JIRA ADAPTER CLASS

export class JiraAdapter {
	private client: JiraClient;
	private siteUrl: string;

	constructor(client: JiraClient, siteUrl: string) {
		this.client = client;
		this.siteUrl = siteUrl;
	}

	async getIssue(issueKey: string): Promise<JiraIssue | null> {
		const res = await this.client.fetch(`/issue/${issueKey}?fields=${JIRA_FIELDS}`);
		if (res.status === 404) return null;
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Jira getIssue failed (${res.status}): ${text}`);
		}
		return res.json() as Promise<JiraIssue>;
	}

	async searchIssues(options: {
		query?: string;
		project?: string;
		status?: string;
		limit?: number;
	} = {}): Promise<JiraIssue[]> {
		const clauses: string[] = [];
		if (options.project) clauses.push(`project = "${options.project.replace(/"/g, '\\"')}"`);
		if (options.status) clauses.push(`status = "${options.status.replace(/"/g, '\\"')}"`);
		if (options.query?.trim()) {
			clauses.push(`text ~ "${options.query.trim().replace(/"/g, '\\"')}"`);
		}

		const jql = clauses.length
			? `${clauses.join(' AND ')} ORDER BY updated DESC`
			: 'ORDER BY updated DESC';

		const params = new URLSearchParams({
			jql,
			fields: JIRA_FIELDS,
			maxResults: String(options.limit ?? 20),
		});

		const res = await this.client.fetch(`/search/jql?${params}`);
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Jira search failed (${res.status}): ${text}`);
		}

		const data = await res.json() as JiraSearchResponse;
		return data.issues;
	}

	normalizeToTask(issue: JiraIssue): {
		task: Partial<Task>;
		cache: ExternalTaskCache;
		link: TaskExternalLink;
	} {
		const externalId = issue.key;
		const source = 'jira' as const;
		const externalUrl = `${this.siteUrl}/browse/${issue.key}`;
		const status = this.mapStatus(issue.fields.status);
		const priority = this.mapPriority(issue.fields.priority?.name);
		const storyPoints = issue.fields.customfield_10016 ?? null;
		const description = extractText(issue.fields.description);

		const task: Partial<Task> = {
			title: issue.fields.summary,
			description,
			status,
			priority,
			storyPoints,
			externalId,
			externalSource: source,
			externalUrl,
		};

		const cache: ExternalTaskCache = {
			externalId,
			source,
			externalUrl,
			title: issue.fields.summary,
			description: description || undefined,
			status: issue.fields.status.name,
			storyPoints,
			priority,
			sprintExternalId: null,
			rawData: issue,
			syncedAt: new Date(),
		};

		const link: TaskExternalLink = {
			externalId,
			source,
			externalUrl,
			confidence: 'explicit',
		};

		return { task, cache, link };
	}

	private mapStatus(status: JiraIssue['fields']['status']): TaskStatus {
		const key = status.statusCategory.key;
		if (key === 'done') return 'done';
		if (key === 'indeterminate') {
			const name = status.name.toLowerCase();
			if (name.includes('review')) return 'in_review';
			if (name.includes('blocked')) return 'blocked';
			return 'in_progress';
		}
		// 'new' category
		const name = status.name.toLowerCase();
		if (name.includes('backlog')) return 'backlog';
		return 'planned';
	}

	private mapPriority(name?: string): TaskPriority {
		if (!name) return 'none';
		const lower = name.toLowerCase();
		if (lower === 'highest' || lower === 'critical') return 'urgent';
		if (lower === 'high') return 'high';
		if (lower === 'medium') return 'medium';
		if (lower === 'low' || lower === 'lowest') return 'low';
		return 'none';
	}
}

export function createJiraAdapter(client: JiraClient, siteUrl: string): JiraAdapter {
	return new JiraAdapter(client, siteUrl);
}
