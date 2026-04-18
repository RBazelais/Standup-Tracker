import type { FormatterInput } from './types';
import { formatDate } from './utils';

export function toPlainText({ standup, includeLinks = true }: FormatterInput): string {
	const lines: string[] = [];
	const linkedTasks = standup.linkedTasks ?? [];

	lines.push(`Standup - ${formatDate(standup.date)}`);
	lines.push('');

	lines.push('Completed:');
	lines.push(formatSection(standup.workCompleted));
	lines.push('');

	lines.push('Planned:');
	lines.push(formatSection(standup.workPlanned));
	lines.push('');

	lines.push('Blockers:');
	lines.push(standup.blockers?.trim() || 'None');

	if (standup.commits?.length > 0) {
		lines.push('');
		lines.push('Commits:');
		standup.commits.forEach(commit => {
			const sha = commit.sha.substring(0, 7);
			const message = commit.commit.message.split('\n')[0];
			lines.push(`- ${sha}: ${message}`);
		});
	}

	if (includeLinks && linkedTasks.length > 0) {
		const issueRefs = linkedTasks
			.map(task => task.externalLinks?.[0]?.externalId ?? task.externalId)
			.filter(Boolean)
			.join(', ');
		lines.push('');
		lines.push(`Linked Issues: ${issueRefs}`);
	}

	return lines.join('\n');
}

function formatSection(content: string): string {
	if (!content?.trim()) return '(none)';

	if (/^[\s]*[-•*]/m.test(content)) {
		return content.trim();
	}

	return content
		.trim()
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => `- ${line}`)
		.join('\n');
}
