import type { FormatterInput } from './types';

/**
 * Jira wiki markup format
 *
 * Output:
 * ```
 * h2. Standup - March 25, 2026
 *
 * *Completed*
 * * React Query migration
 * * Fixed auth bug
 *
 * *Planned*
 * * Export formats
 * * Sprint picker
 *
 * *Blockers*
 * None
 *
 * *Linked Issues:* [#42|https://github.com/org/repo/issues/42]
 * ```
 */
export function toJira({ standup, includeLinks = true }: FormatterInput): string {
	const lines: string[] = [];
	const linkedTasks = standup.linkedTasks ?? [];

	lines.push(`h2. Standup - ${formatDate(standup.date)}`);
	lines.push('');

	lines.push('*Completed*');
	lines.push(formatSection(standup.workCompleted));
	lines.push('');

	lines.push('*Planned*');
	lines.push(formatSection(standup.workPlanned));
	lines.push('');

	lines.push('*Blockers*');
	lines.push(standup.blockers?.trim() || 'None');

	if (standup.commits?.length > 0) {
		lines.push('');
		lines.push('*Commits*');
		standup.commits.forEach(commit => {
			const sha = commit.sha.substring(0, 7);
			const message = commit.commit.message.split('\n')[0];
			lines.push(`* {{${sha}}} ${message}`);
		});
	}

	if (includeLinks && linkedTasks.length > 0) {
		lines.push('');
		const issueLinks = linkedTasks
			.map(task => {
				const link = task.externalLinks?.[0];
				if (!link) return task.externalId ?? null;
				return link.externalUrl
					? `[${link.externalId}|${link.externalUrl}]`
					: link.externalId;
			})
			.filter(Boolean)
			.join(', ');
		lines.push(`*Linked Issues:* ${issueLinks}`);
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
			return `* ${cleaned}`;
		})
		.join('\n');
}
