import type { FormatterInput } from './types';

/**
 * Slack mrkdwn format - bold with *, emoji-friendly
 *
 * Output:
 * ```
 * *Standup - March 25, 2026*
 *
 * ✅ *Completed*
 * • React Query migration (#42)
 * • Fixed auth redirect bug (#48)
 *
 * 📋 *Planned*
 * • Export formats (#45)
 * • Sprint picker UI
 *
 * 🚧 *Blockers*
 * None
 * ```
 */
export function toSlack({ standup, includeLinks = true }: FormatterInput): string {
	const lines: string[] = [];
	const linkedTasks = standup.linkedTasks ?? [];

	lines.push(`*Standup - ${formatDate(standup.date)}*`);
	lines.push('');

	lines.push('✅ *Completed*');
	lines.push(formatSection(standup.workCompleted));
	lines.push('');

	lines.push('📋 *Planned*');
	lines.push(formatSection(standup.workPlanned));
	lines.push('');

	lines.push('🚧 *Blockers*');
	lines.push(standup.blockers?.trim() || 'None');

	if (includeLinks && linkedTasks.length > 0) {
		lines.push('');
		const issueLinks = linkedTasks
			.map(task => {
				const link = task.externalLinks?.[0];
				if (!link) return null;
				return link.externalUrl
					? `<${link.externalUrl}|${link.externalId}>`
					: link.externalId;
			})
			.filter(Boolean)
			.join(', ');
		lines.push(`🔗 ${issueLinks}`);
	}

	return lines.join('\n');
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr + 'T00:00:00');
	return date.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
}

function formatSection(content: string): string {
	if (!content?.trim()) return '(none)';

	return content
		.trim()
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => {
			const cleaned = line.replace(/^[\s]*[-•*]\s*/, '');
			return `• ${cleaned}`;
		})
		.join('\n');
}
