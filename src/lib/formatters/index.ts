import { toPlainText } from './plain';
import { toSlack } from './slack';
import { toJira } from './jira';
import { toMarkdown } from './markdown';

export { toPlainText, toSlack, toJira, toMarkdown };
export type { FormatterInput, Formatter } from './types';

export const formatters = {
	plain: toPlainText,
	slack: toSlack,
	jira: toJira,
	markdown: toMarkdown,
} as const;

export type FormatType = keyof typeof formatters;
