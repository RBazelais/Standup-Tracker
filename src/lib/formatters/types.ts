import type { Standup } from '@/types';

export interface FormatterInput {
	standup: Standup;
	includeLinks?: boolean;
}

export type Formatter = (input: FormatterInput) => string;
