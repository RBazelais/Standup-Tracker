import { describe, it, expect } from 'vitest';
import { toPlainText } from '../plain';
import type { FormatterInput } from '../types';

describe('toPlainText', () => {
	const baseStandup = {
		id: '123',
		date: '2026-03-25',
		workCompleted: 'React Query migration\nFixed auth bug',
		workPlanned: 'Export formats\nSprint picker',
		blockers: '',
		commits: [],
		linkedTasks: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	it('formats a basic standup', () => {
		const input: FormatterInput = { standup: baseStandup };
		const result = toPlainText(input);

		expect(result).toContain('Standup - March 25, 2026');
		expect(result).toContain('Completed:');
		expect(result).toContain('- React Query migration');
		expect(result).toContain('- Fixed auth bug');
		expect(result).toContain('Planned:');
		expect(result).toContain('- Export formats');
		expect(result).toContain('- Sprint picker');
		expect(result).toContain('Blockers:');
		expect(result).toContain('None');
	});

	it('shows blockers when present', () => {
		const input: FormatterInput = {
			standup: { ...baseStandup, blockers: 'Waiting on API access' },
		};
		const result = toPlainText(input);

		expect(result).toContain('Blockers:');
		expect(result).toContain('Waiting on API access');
		expect(result).not.toContain('None');
	});

	it('preserves existing bullet formatting without double-bulleting', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				workCompleted: '- Already has bullets\n- Second item',
			},
		};
		const result = toPlainText(input);

		expect(result).toContain('- Already has bullets');
		expect(result).not.toContain('- - Already has bullets');
	});

	it('handles empty sections gracefully', () => {
		const input: FormatterInput = {
			standup: { ...baseStandup, workCompleted: '', workPlanned: '' },
		};
		const result = toPlainText(input);

		expect(result).toContain('Completed:');
		expect(result).toContain('(none)');
		expect(result).toContain('Planned:');
	});

	it('appends linked issues when includeLinks is true', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				linkedTasks: [
					{
						id: 'task-1',
						title: 'React Query Migration',
						status: 'in_progress',
						description: '',
						externalLinks: [{ externalId: '#42', source: 'github', externalUrl: 'https://github.com/org/repo/issues/42', confidence: 'explicit' }],
						createdAt: new Date(),
					},
					{
						id: 'task-2',
						title: 'Auth bug',
						status: 'done',
						description: '',
						externalLinks: [{ externalId: '#48', source: 'github', externalUrl: 'https://github.com/org/repo/issues/48', confidence: 'explicit' }],
						createdAt: new Date(),
					},
				],
			},
			includeLinks: true,
		};
		const result = toPlainText(input);

		expect(result).toContain('Linked Issues: #42, #48');
	});

	it('omits linked issues section when includeLinks is false', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				linkedTasks: [
					{
						id: 'task-1',
						title: 'React Query Migration',
						status: 'in_progress',
						description: '',
						externalLinks: [{ externalId: '#42', source: 'github', externalUrl: '', confidence: 'explicit' }],
						createdAt: new Date(),
					},
				],
			},
			includeLinks: false,
		};
		const result = toPlainText(input);

		expect(result).not.toContain('Linked Issues');
		expect(result).not.toContain('#42');
	});

	it('omits linked issues section when no tasks provided', () => {
		const input: FormatterInput = {
			standup: { ...baseStandup, linkedTasks: [] },
			includeLinks: true,
		};
		const result = toPlainText(input);

		expect(result).not.toContain('Linked Issues');
	});

	it('includes a commits section when commits are present', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				commits: [
					{
						sha: 'abc1234def',
						commit: { message: 'feat: add export formatters\n\nLonger body', author: { name: 'testuser' } },
					},
					{
						sha: 'bcd5678efg',
						commit: { message: 'fix: correct date handling', author: { name: 'testuser' } },
					},
				],
			},
		};
		const result = toPlainText(input);

		expect(result).toContain('Commits:');
		expect(result).toContain('- abc1234: feat: add export formatters');
		expect(result).toContain('- bcd5678: fix: correct date handling');
		expect(result).not.toContain('Longer body');
	});

	it('omits commits section when commits array is empty', () => {
		const result = toPlainText({ standup: baseStandup });

		expect(result).not.toContain('Commits:');
	});
});
