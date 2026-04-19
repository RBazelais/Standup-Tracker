import type { FormatterInput } from './types';
import { formatDate } from './utils';

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

	if (standup.commits?.length > 0) {
		lines.push('');
		lines.push('💾 *Commits*');
		standup.commits.forEach(commit => {
			const sha = commit.sha.substring(0, 7);
			const message = commit.commit.message.split('\n')[0];
			lines.push(`• \`${sha}\` ${message}`);
		});
	}

	if (includeLinks && linkedTasks.length > 0) {
		const issueLinks = linkedTasks
			.map(task => {
				const link = task.externalLinks?.[0];
				if (link) {
					return link.externalUrl
						? `<${link.externalUrl}|${link.externalId}>`
						: link.externalId;
				}
				return task.externalId ?? null;
			})
			.filter(Boolean)
			.join(', ');
		if (issueLinks) {
			lines.push('');
			lines.push(`🔗 ${issueLinks}`);
		}
	}

	return lines.join('\n');
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
