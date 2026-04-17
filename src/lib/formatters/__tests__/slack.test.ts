import { describe, it, expect } from 'vitest';
import { toSlack } from '../slack';
import type { FormatterInput } from '../types';

describe('toSlack', () => {
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

	it('formats with Slack mrkdwn bold syntax', () => {
		const input: FormatterInput = { standup: baseStandup };
		const result = toSlack(input);

		expect(result).toContain('*Standup - March 25, 2026*');
		expect(result).toContain('✅ *Completed*');
		expect(result).toContain('📋 *Planned*');
		expect(result).toContain('🚧 *Blockers*');
	});

	it('uses bullet points for list items', () => {
		const input: FormatterInput = { standup: baseStandup };
		const result = toSlack(input);

		expect(result).toContain('• React Query migration');
		expect(result).toContain('• Fixed auth bug');
		expect(result).toContain('• Export formats');
	});

	it('shows blockers when present', () => {
		const input: FormatterInput = {
			standup: { ...baseStandup, blockers: 'Waiting on API access' },
		};
		const result = toSlack(input);

		expect(result).toContain('🚧 *Blockers*');
		expect(result).toContain('Waiting on API access');
	});

	it('handles empty sections gracefully', () => {
		const input: FormatterInput = {
			standup: { ...baseStandup, workCompleted: '', workPlanned: '' },
		};
		const result = toSlack(input);

		expect(result).toContain('(none)');
	});

	it('formats linked issues as Slack links', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				linkedTasks: [
					{
						id: 'task-1',
						title: 'React Query Migration',
						description: '',
						status: 'in_progress',
						externalLinks: [{ externalId: '#42', source: 'github', externalUrl: 'https://github.com/org/repo/issues/42', confidence: 'explicit' }],
						createdAt: new Date(),
					},
				],
			},
			includeLinks: true,
		};
		const result = toSlack(input);

		expect(result).toContain('🔗 <https://github.com/org/repo/issues/42|#42>');
	});

	it('omits linked issues when includeLinks is false', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				linkedTasks: [
					{
						id: 'task-1',
						title: 'Test',
						description: '',
						status: 'done',
						externalLinks: [{ externalId: '#42', source: 'github', externalUrl: 'https://github.com/org/repo/issues/42', confidence: 'explicit' }],
						createdAt: new Date(),
					},
				],
			},
			includeLinks: false,
		};
		const result = toSlack(input);

		expect(result).not.toContain('🔗');
		expect(result).not.toContain('#42');
	});

	it('normalizes existing bullets to bullet points', () => {
		const input: FormatterInput = {
			standup: {
				...baseStandup,
				workCompleted: '- Dashes\n* Asterisks\n• Already bullets',
			},
		};
		const result = toSlack(input);

		expect(result).toContain('• Dashes');
		expect(result).toContain('• Asterisks');
		expect(result).toContain('• Already bullets');
		// No line should start with a raw dash or asterisk bullet
		expect(result).not.toMatch(/^\s*- /m);
		expect(result).not.toMatch(/^\s*\* /m);
	});
});
