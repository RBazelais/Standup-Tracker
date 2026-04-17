import { describe, it, expect } from 'vitest';
import { toJira } from '../jira';
import type { FormatterInput } from '../types';

describe('toJira', () => {
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

	it('formats the header with Jira heading syntax', () => {
		const result = toJira({ standup: baseStandup });

		expect(result).toContain('h2. Standup - March 25, 2026');
	});

	it('formats section headings as Jira bold', () => {
		const result = toJira({ standup: baseStandup });

		expect(result).toContain('*Completed*');
		expect(result).toContain('*Planned*');
		expect(result).toContain('*Blockers*');
	});

	it('uses Jira unordered list syntax for items', () => {
		const result = toJira({ standup: baseStandup });

		expect(result).toContain('* React Query migration');
		expect(result).toContain('* Fixed auth bug');
		expect(result).toContain('* Export formats');
	});

	it('normalizes existing bullets to Jira list syntax', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				workCompleted: '- Dashes\n• Bullets\n* Already Jira',
			},
		};
		const result = toJira(input);

		expect(result).toContain('* Dashes');
		expect(result).toContain('* Bullets');
		expect(result).toContain('* Already Jira');
		expect(result).not.toMatch(/^\s*- /m);
		expect(result).not.toMatch(/^\s*• /m);
	});

	it('shows blockers when present', () => {
		const input: FormatterInput = {
			standup: { ...baseStandup, blockers: 'Waiting on API access' },
		};
		const result = toJira(input);

		expect(result).toContain('Waiting on API access');
		expect(result).not.toContain('None');
	});

	it('shows None when blockers is empty', () => {
		const result = toJira({ standup: baseStandup });

		expect(result).toContain('None');
	});

	it('handles empty sections gracefully', () => {
		const input: FormatterInput = {
			standup: { ...baseStandup, workCompleted: '', workPlanned: '' },
		};
		const result = toJira(input);

		expect(result).toContain('(none)');
	});

	it('formats linked issues as Jira links', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				linkedTasks: [
					{
						id: 'task-1',
						title: 'React Query Migration',
						description: '',
						status: 'in_progress',
						externalLinks: [{
							externalId: '#42',
							source: 'github',
							externalUrl: 'https://github.com/org/repo/issues/42',
							confidence: 'explicit',
						}],
						createdAt: new Date(),
					},
				],
			},
			includeLinks: true,
		};
		const result = toJira(input);

		// Jira link format: [text|url]
		expect(result).toContain('[#42|https://github.com/org/repo/issues/42]');
	});

	it('falls back to plain externalId when no URL', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				linkedTasks: [{
					id: 'task-1',
					title: 'Auth bug',
					description: '',
					status: 'done',
					externalLinks: [{
						externalId: '#48',
						source: 'github',
						externalUrl: undefined,
						confidence: 'explicit',
					}],
					createdAt: new Date(),
				}],
			},
			includeLinks: true,
		};
		const result = toJira(input);

		expect(result).toContain('#48');
		expect(result).not.toContain('[#48|null]');
	});

	it('omits linked issues when includeLinks is false', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				linkedTasks: [{
					id: 'task-1',
					title: 'Test',
					description: '',
					status: 'done',
					externalLinks: [{
						externalId: '#42',
						source: 'github',
						externalUrl: 'https://github.com/org/repo/issues/42',
						confidence: 'explicit',
					}],
					createdAt: new Date(),
				}],
			},
			includeLinks: false,
		};
		const result = toJira(input);

		expect(result).not.toContain('#42');
	});
});
