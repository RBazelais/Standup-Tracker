import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JiraAdapter } from '../jira-adapter';
import type { JiraIssue } from '../jira-adapter';
import type { JiraClient } from '../jira-client';

const SITE_URL = 'https://my-team.atlassian.net';

function makeClient(fetchImpl: (path: string) => Promise<Response>): JiraClient {
	return {
		cloudId: 'cloud-abc',
		siteUrl: '',
		fetch: vi.fn().mockImplementation(fetchImpl),
	};
}

function makeIssue(overrides: Partial<JiraIssue['fields']> = {}): JiraIssue {
	return {
		id: '10001',
		key: 'STUP-1',
		fields: {
			summary: 'Fix login bug',
			description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Details here' }] }] },
			status: {
				name: 'In Progress',
				statusCategory: { key: 'indeterminate' },
			},
			priority: { name: 'High' },
			assignee: { displayName: 'Rachel', accountId: 'acct-1' },
			labels: ['frontend'],
			customfield_10016: 3,
			created: '2026-01-01T00:00:00.000Z',
			updated: '2026-01-02T00:00:00.000Z',
			...overrides,
		},
	};
}

describe('JiraAdapter', () => {
	let adapter: JiraAdapter;

	beforeEach(() => vi.clearAllMocks());

	describe('getIssue', () => {
		it('returns the issue on 200', async () => {
			const issue = makeIssue();
			const client = makeClient(() => Promise.resolve(new Response(JSON.stringify(issue), { status: 200 })));
			adapter = new JiraAdapter(client, SITE_URL);

			const result = await adapter.getIssue('STUP-1');
			expect(result).toMatchObject({ id: '10001', key: 'STUP-1' });
		});

		it('returns null on 404', async () => {
			const client = makeClient(() => Promise.resolve(new Response('Not Found', { status: 404 })));
			adapter = new JiraAdapter(client, SITE_URL);

			const result = await adapter.getIssue('STUP-999');
			expect(result).toBeNull();
		});

		it('throws on non-404 error', async () => {
			const client = makeClient(() => Promise.resolve(new Response('Server Error', { status: 500 })));
			adapter = new JiraAdapter(client, SITE_URL);

			await expect(adapter.getIssue('STUP-1')).rejects.toThrow('Jira getIssue failed (500)');
		});

		it('includes the fields query param', async () => {
			const issue = makeIssue();
			const client = makeClient(() => Promise.resolve(new Response(JSON.stringify(issue), { status: 200 })));
			adapter = new JiraAdapter(client, SITE_URL);

			await adapter.getIssue('STUP-1');

			expect(client.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/issue/STUP-1?fields=')
			);
		});
	});

	describe('searchIssues', () => {
		it('returns issues from the search response', async () => {
			const issue = makeIssue();
			const client = makeClient(() =>
				Promise.resolve(new Response(JSON.stringify({ issues: [issue], total: 1 }), { status: 200 }))
			);
			adapter = new JiraAdapter(client, SITE_URL);

			const results = await adapter.searchIssues({ query: 'login' });
			expect(results).toHaveLength(1);
			expect(results[0].key).toBe('STUP-1');
		});

		it('builds JQL with project and query', async () => {
			const client = makeClient(() =>
				Promise.resolve(new Response(JSON.stringify({ issues: [], total: 0 }), { status: 200 }))
			);
			adapter = new JiraAdapter(client, SITE_URL);

			await adapter.searchIssues({ query: 'login', project: 'STUP' });

			const calledPath = (client.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			const jql = new URLSearchParams(calledPath.split('?')[1]).get('jql') ?? '';
			expect(jql).toContain('project = "STUP"');
			expect(jql).toContain('text ~ "login"');
		});

		it('falls back to ORDER BY updated DESC when no filters given', async () => {
			const client = makeClient(() =>
				Promise.resolve(new Response(JSON.stringify({ issues: [], total: 0 }), { status: 200 }))
			);
			adapter = new JiraAdapter(client, SITE_URL);

			await adapter.searchIssues();

			const calledPath = (client.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			const jql = new URLSearchParams(calledPath.split('?')[1]).get('jql') ?? '';
			expect(jql).toBe('ORDER BY updated DESC');
		});

		it('throws on error response', async () => {
			const client = makeClient(() => Promise.resolve(new Response('Bad Request', { status: 400 })));
			adapter = new JiraAdapter(client, SITE_URL);

			await expect(adapter.searchIssues({ query: 'x' })).rejects.toThrow('Jira search failed (400)');
		});
	});

	describe('normalizeToTask', () => {
		beforeEach(() => {
			const client = makeClient(() => Promise.resolve(new Response('{}', { status: 200 })));
			adapter = new JiraAdapter(client, SITE_URL);
		});

		it('builds the correct browse URL', () => {
			const { task, link } = adapter.normalizeToTask(makeIssue());
			expect(task.externalUrl).toBe('https://my-team.atlassian.net/browse/STUP-1');
			expect(link.externalUrl).toBe('https://my-team.atlassian.net/browse/STUP-1');
		});

		it('uses the issue key as externalId', () => {
			const { task, link } = adapter.normalizeToTask(makeIssue());
			expect(task.externalId).toBe('STUP-1');
			expect(link.externalId).toBe('STUP-1');
			expect(link.source).toBe('jira');
		});

		it('extracts story points from customfield_10016', () => {
			const { task } = adapter.normalizeToTask(makeIssue({ customfield_10016: 5 }));
			expect(task.storyPoints).toBe(5);
		});

		it('returns null story points when field is absent', () => {
			const { task } = adapter.normalizeToTask(makeIssue({ customfield_10016: undefined }));
			expect(task.storyPoints).toBeNull();
		});

		it.each([
			['done', 'done', 'done'],
			['in_review', 'In Review', 'indeterminate'],
			['blocked', 'Blocked', 'indeterminate'],
			['in_progress', 'In Progress', 'indeterminate'],
			['backlog', 'Backlog', 'new'],
			['planned', 'To Do', 'new'],
		] as const)('maps status "%s" correctly', (expected, name, categoryKey) => {
			const { task } = adapter.normalizeToTask(
				makeIssue({ status: { name, statusCategory: { key: categoryKey } } })
			);
			expect(task.status).toBe(expected);
		});

		it.each([
			['urgent', 'Highest'],
			['urgent', 'Critical'],
			['high', 'High'],
			['medium', 'Medium'],
			['low', 'Low'],
			['low', 'Lowest'],
			['none', undefined],
		] as const)('maps priority "%s" for Jira name "%s"', (expected, jiraName) => {
			const { task } = adapter.normalizeToTask(
				makeIssue({ priority: jiraName ? { name: jiraName } : null })
			);
			expect(task.priority).toBe(expected);
		});

		it('extracts plain text from ADF description', () => {
			const { task } = adapter.normalizeToTask(makeIssue());
			expect(task.description).toBe('Details here');
		});

		it('handles null description', () => {
			const { task } = adapter.normalizeToTask(makeIssue({ description: null }));
			expect(task.description).toBe('');
		});
	});
});
