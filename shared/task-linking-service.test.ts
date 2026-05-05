import { describe, it, expect } from 'vitest';
import { TaskLinkingService } from './task-linking-service';

// Minimal stub — determineConfidence doesn't touch the db
const stubDb = {} as ConstructorParameters<typeof TaskLinkingService>[0];
const service = new TaskLinkingService(stubDb);

describe('TaskLinkingService.determineConfidence', () => {
	describe('explicit keywords', () => {
		it('"Fixes #42" is explicit', () => {
			expect(service.determineConfidence('Fixes #42')).toBe('explicit');
		});

		it('"fix #42" (lowercase) is explicit', () => {
			expect(service.determineConfidence('fix #42')).toBe('explicit');
		});

		it('"fixes #42" is explicit', () => {
			expect(service.determineConfidence('fixes #42')).toBe('explicit');
		});

		it('"Closes #5" is explicit', () => {
			expect(service.determineConfidence('Closes #5')).toBe('explicit');
		});

		it('"closed #5" is explicit', () => {
			expect(service.determineConfidence('closed #5')).toBe('explicit');
		});

		it('"close #5" is explicit', () => {
			expect(service.determineConfidence('close #5')).toBe('explicit');
		});

		it('"Resolves #3" is explicit', () => {
			expect(service.determineConfidence('Resolves #3')).toBe('explicit');
		});

		it('"resolved #3" is explicit', () => {
			expect(service.determineConfidence('resolved #3')).toBe('explicit');
		});

		it('"resolve #3" is explicit', () => {
			expect(service.determineConfidence('resolve #3')).toBe('explicit');
		});
	});

	describe('inferred references', () => {
		it('bare "#42" is inferred', () => {
			expect(service.determineConfidence('#42')).toBe('inferred');
		});

		it('"GH-42" is inferred', () => {
			expect(service.determineConfidence('GH-42')).toBe('inferred');
		});

		it('"see #42" is inferred', () => {
			expect(service.determineConfidence('see #42')).toBe('inferred');
		});

		it('"related to #42" is inferred', () => {
			expect(service.determineConfidence('related to #42')).toBe('inferred');
		});

		it('"owner/repo#42" is inferred', () => {
			expect(service.determineConfidence('owner/repo#42')).toBe('inferred');
		});
	});
});
