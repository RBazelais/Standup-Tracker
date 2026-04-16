// src/lib/integrations/github/__tests__/github-adapter.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubAdapter } from '../github-adapter';

describe('GitHubAdapter', () => {
	let adapter: GitHubAdapter;

	beforeEach(() => {
		adapter = new GitHubAdapter('fake-token', 'RBazelais', 'standup-tracker');
	});

	describe('parseIssueRefs', () => {
		it('parses simple #123 references', () => {
			const commits = [
				{ message: 'Fix bug in #42' },
				{ message: 'Update #123 with new logic' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(2);
			expect(refs[0]).toEqual({
				owner: 'RBazelais',
				repo: 'standup-tracker',
				number: 42,
				raw: '#42',
			});
			expect(refs[1]).toEqual({
				owner: 'RBazelais',
				repo: 'standup-tracker',
				number: 123,
				raw: '#123',
			});
		});

		it('parses Fixes/Closes/Resolves keywords', () => {
			const commits = [
				{ message: 'Fixes #42' },
				{ message: 'closes #43' },
				{ message: 'Resolves #44' },
				{ message: 'fix #45' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(4);
			expect(refs.map(r => r.number)).toEqual([42, 43, 44, 45]);
		});

		it('parses owner/repo#123 format', () => {
			const commits = [
				{ message: 'Related to umbrella/nemesis#100' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(1);
			expect(refs[0]).toEqual({
				owner: 'umbrella',
				repo: 'nemesis',
				number: 100,
				raw: 'umbrella/nemesis#100',
			});
		});

		it('parses GH-123 format', () => {
			const commits = [
				{ message: 'Working on GH-42' },
				{ message: 'See gh-43 for details' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(2);
			expect(refs.map(r => r.number)).toEqual([42, 43]);
		});

		it('deduplicates references', () => {
			const commits = [
				{ message: 'Start #42' },
				{ message: 'Continue #42' },
				{ message: 'Finish #42' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(42);
		});

		it('keeps issues with the same number from different repos', () => {
			const commits = [
				{ message: 'See acme/frontend#42 and acme/backend#42' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(2);
			expect(refs.map(r => `${r.owner}/${r.repo}#${r.number}`)).toEqual([
				'acme/frontend#42',
				'acme/backend#42',
			]);
		});

		it('deduplicates owner/repo refs regardless of casing', () => {
			const commits = [
				{ message: 'Fixes Acme/Widget#1 and acme/widget#1' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(1);
		});

		it('handles multiple references in one commit', () => {
			const commits = [
				{ message: 'Fixes #42, closes #43, and relates to #44' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(3);
			expect(refs.map(r => r.number)).toEqual([42, 43, 44]);
		});

		it('ignores HTML entities like &#123;', () => {
			const commits = [
				{ message: 'Using &#123; for brackets' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(0);
		});

		it('handles empty commits', () => {
			const refs = adapter.parseIssueRefs([]);
			expect(refs).toHaveLength(0);
		});

		it('handles commits with no references', () => {
			const commits = [
				{ message: 'Just a regular commit' },
				{ message: 'Another one without issues' },
			];

			const refs = adapter.parseIssueRefs(commits);

			expect(refs).toHaveLength(0);
		});
	});

	describe('normalizeToTask', () => {
		const mockIssue = {
			id: 12345,
			number: 42,
			title: 'React Query Migration',
			body: 'Migrate from Zustand to React Query for server state.',
			state: 'open' as const,
			html_url: 'https://github.com/RBazelais/standup-tracker/issues/42',
			labels: [
				{ id: 1, name: 'enhancement', color: 'a2eeef' },
				{ id: 2, name: 'priority:high', color: 'd73a4a' },
				{ id: 3, name: 'points:8', color: '0e8a16' },
			],
			milestone: {
				id: 1,
				number: 3,
				title: 'Sprint 3',
				due_on: '2026-01-26T00:00:00Z',
				state: 'open' as const,
			},
			assignee: {
				login: 'RBazelais',
				avatar_url: 'https://github.com/RBazelais.png',
			},
			created_at: '2026-01-10T10:00:00Z',
			updated_at: '2026-01-15T14:30:00Z',
			closed_at: null,
		};

		it('normalizes basic issue data', () => {
			const { task } = adapter.normalizeToTask(mockIssue, 'RBazelais', 'standup-tracker');

			expect(task.title).toBe('React Query Migration');
			expect(task.description).toBe('Migrate from Zustand to React Query for server state.');
			expect(task.priority).toBe('high');
			expect(task.storyPoints).toBe(8);
		});

		it('maps open state to planned', () => {
			const { task } = adapter.normalizeToTask(mockIssue, 'RBazelais', 'standup-tracker');
			expect(task.status).toBe('planned');
		});

		it('maps closed state to done', () => {
			const closedIssue = { ...mockIssue, state: 'closed' as const };
			const { task } = adapter.normalizeToTask(closedIssue, 'RBazelais', 'standup-tracker');
			expect(task.status).toBe('done');
		});

		it('detects in_progress from labels', () => {
			const wipIssue = {
				...mockIssue,
				labels: [{ id: 1, name: 'in progress', color: '000000' }],
			};
			const { task } = adapter.normalizeToTask(wipIssue, 'RBazelais', 'standup-tracker');
			expect(task.status).toBe('in_progress');
		});

		it('detects in_review from labels', () => {
			const reviewIssue = {
				...mockIssue,
				labels: [{ id: 1, name: 'needs review', color: '000000' }],
			};
			const { task } = adapter.normalizeToTask(reviewIssue, 'RBazelais', 'standup-tracker');
			expect(task.status).toBe('in_review');
		});

		it('extracts priority from labels', () => {
			const testCases = [
				{ label: 'priority:critical', expected: 'urgent' },
				{ label: 'p0', expected: 'urgent' },
				{ label: 'priority:high', expected: 'high' },
				{ label: 'p1', expected: 'high' },
				{ label: 'priority:medium', expected: 'medium' },
				{ label: 'priority:low', expected: 'low' },
				{ label: 'bug', expected: 'high' }, // Inferred
			];

			for (const { label, expected } of testCases) {
				const issue = {
					...mockIssue,
					labels: [{ id: 1, name: label, color: '000000' }],
				};
				const { task } = adapter.normalizeToTask(issue, 'RBazelais', 'standup-tracker');
				expect(task.priority).toBe(expected);
			}
		});

		it('extracts story points from labels', () => {
			const testCases = [
				{ label: 'points:5', expected: 5 },
				{ label: 'SP:3', expected: 3 },
				{ label: 'estimate:8', expected: 8 },
				{ label: 'size:L', expected: 5 },
				{ label: 'size:XL', expected: 8 },
				{ label: 'M', expected: 3 },
			];

			for (const { label, expected } of testCases) {
				const issue = {
					...mockIssue,
					labels: [{ id: 1, name: label, color: '000000' }],
				};
				const { task } = adapter.normalizeToTask(issue, 'RBazelais', 'standup-tracker');
				expect(task.storyPoints).toBe(expected);
			}
		});

		it('creates correct external link', () => {
			const { link } = adapter.normalizeToTask(mockIssue, 'RBazelais', 'standup-tracker');

			expect(link.externalId).toBe('#42');
			expect(link.source).toBe('github');
			expect(link.externalUrl).toBe('https://github.com/RBazelais/standup-tracker/issues/42');
		});

		it('creates correct cache entry', () => {
			const { cache } = adapter.normalizeToTask(mockIssue, 'RBazelais', 'standup-tracker');

			expect(cache.externalId).toBe('#42');
			expect(cache.source).toBe('github');
			expect(cache.title).toBe('React Query Migration');
			expect(cache.sprintExternalId).toBe('3');
			expect(cache.rawData).toEqual(mockIssue);
		});

		it('handles issue without milestone', () => {
			const noMilestoneIssue = { ...mockIssue, milestone: null };
			const { cache } = adapter.normalizeToTask(noMilestoneIssue, 'RBazelais', 'standup-tracker');

			expect(cache.sprintExternalId).toBeNull();
		});

		it('handles issue without labels', () => {
			const noLabelsIssue = { ...mockIssue, labels: [] };
			const { task } = adapter.normalizeToTask(noLabelsIssue, 'RBazelais', 'standup-tracker');

			expect(task.priority).toBe('none');
			expect(task.storyPoints).toBeNull();
		});
	});
});

describe('GitHubAdapter API calls', () => {
	// These tests would use MSW or similar to mock the Octokit calls
	// Skipping for brevity but structure would be:

	describe('getIssue', () => {
		it.todo('fetches issue from GitHub API');
		it.todo('returns null for 404');
		it.todo('throws on other errors');
	});

	describe('searchIssues', () => {
		it.todo('searches with correct parameters');
		it.todo('filters out pull requests');
		it.todo('respects limit');
	});

	describe('getIssues', () => {
		it.todo('batches requests by repo');
		it.todo('handles mixed success/failure');
	});
});