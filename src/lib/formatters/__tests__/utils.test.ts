import { describe, it, expect } from 'vitest';
import { formatDate } from '../utils';

describe('formatDate', () => {
	it('formats a date string as long locale date', () => {
		expect(formatDate('2026-03-25')).toBe('March 25, 2026');
	});

	it('handles the start of a month', () => {
		expect(formatDate('2026-01-01')).toBe('January 1, 2026');
	});

	it('handles the end of a year', () => {
		expect(formatDate('2025-12-31')).toBe('December 31, 2025');
	});
});
