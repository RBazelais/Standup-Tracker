import { describe, it, expect } from 'vitest';
import { GitHubAdapter } from './github-adapter';

// parseIssueRefs is pure — no network calls, safe to instantiate with a fake token
const adapter = new GitHubAdapter('fake-token', 'owner', 'repo');

describe('GitHubAdapter.parseIssueRefs', () => {
	describe('basic detection', () => {
		it('returns empty array when no refs in commits', () => {
			const refs = adapter.parseIssueRefs([
				{ message: 'fix typo in readme' },
				{ message: 'update dependencies' },
			]);
			expect(refs).toHaveLength(0);
		});

		it('detects a bare #N reference', () => {
			const refs = adapter.parseIssueRefs([{ message: 'work on #42' }]);
			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(42);
		});

		it('detects GH-N reference', () => {
			const refs = adapter.parseIssueRefs([{ message: 'related to GH-7' }]);
			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(7);
		});

		it('detects owner/repo#N cross-repo reference', () => {
			const refs = adapter.parseIssueRefs([{ message: 'see acme/widget#99' }]);
			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(99);
			expect(refs[0].owner).toBe('acme');
			expect(refs[0].repo).toBe('widget');
		});
	});

	describe('closing keywords', () => {
		it('detects "Fixes #N"', () => {
			const refs = adapter.parseIssueRefs([{ message: 'Fixes #12' }]);
			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(12);
		});

		it('detects "fix #N" (lowercase)', () => {
			const refs = adapter.parseIssueRefs([{ message: 'fix #12' }]);
			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(12);
		});

		it('detects "Closes #N"', () => {
			const refs = adapter.parseIssueRefs([{ message: 'Closes #5' }]);
			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(5);
		});

		it('detects "Resolves #N"', () => {
			const refs = adapter.parseIssueRefs([{ message: 'Resolves #3' }]);
			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(3);
		});
	});

	describe('deduplication', () => {
		it('does not duplicate the same issue referenced twice in one commit', () => {
			const refs = adapter.parseIssueRefs([
				{ message: 'Fixes #42, also closes #42' },
			]);
			expect(refs).toHaveLength(1);
			expect(refs[0].number).toBe(42);
		});

		it('does not duplicate the same issue across multiple commits', () => {
			const refs = adapter.parseIssueRefs([
				{ message: 'progress on #10' },
				{ message: 'more work on #10' },
			]);
			expect(refs).toHaveLength(1);
		});

		it('keeps distinct issues from multiple commits', () => {
			const refs = adapter.parseIssueRefs([
				{ message: 'work on #10' },
				{ message: 'also #11' },
			]);
			expect(refs).toHaveLength(2);
			const numbers = refs.map(r => r.number).sort((a, b) => a - b);
			expect(numbers).toEqual([10, 11]);
		});
	});

	describe('edge cases', () => {
		it('ignores non-numeric refs like #abc', () => {
			const refs = adapter.parseIssueRefs([{ message: 'see #abc' }]);
			expect(refs).toHaveLength(0);
		});

		it('falls back to default owner/repo for bare #N refs', () => {
			const refs = adapter.parseIssueRefs([{ message: '#55' }]);
			expect(refs[0].owner).toBe('owner');
			expect(refs[0].repo).toBe('repo');
		});

		it('handles empty commits array', () => {
			const refs = adapter.parseIssueRefs([]);
			expect(refs).toHaveLength(0);
		});
	});
});
