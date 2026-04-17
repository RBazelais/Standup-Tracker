import type { FormatterInput } from './types';

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
