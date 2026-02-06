import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { format, parseISO } from "date-fns";
import {
	toDateString,
	getToday,
	getYesterday,
	getTodayRange,
	getYesterdayRange,
	getThisWeekRange,
	getLastWeekRange,
	getLastFridayRange,
	localDateToUTCStart,
	localDateToUTCEnd,
	isCommitInDateRange,
} from "./dateUtils";

describe("dateUtils", () => {
	describe("toDateString", () => {
		it("formats date as yyyy-MM-dd", () => {
			const date = new Date(2026, 1, 3); // Feb 3, 2026 (month is 0-indexed)
			expect(toDateString(date)).toBe("2026-02-03");
		});

		it("pads single digit months and days", () => {
			const date = new Date(2026, 0, 5); // Jan 5, 2026
			expect(toDateString(date)).toBe("2026-01-05");
		});
	});

	describe("getToday / getYesterday", () => {
		beforeEach(() => {
			// Mock Date to Tuesday, Feb 3, 2026 at 9:49 PM local time
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 1, 3, 21, 49, 0));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("getToday returns today's date", () => {
			expect(getToday()).toBe("2026-02-03");
		});

		it("getYesterday returns yesterday's date", () => {
			expect(getYesterday()).toBe("2026-02-02");
		});
	});

	describe("Date Range Presets", () => {
		beforeEach(() => {
			// Mock Date to Tuesday, Feb 3, 2026
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 1, 3, 21, 49, 0));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("getTodayRange returns today only", () => {
			const range = getTodayRange();
			expect(range.start).toBe("2026-02-03");
			expect(range.end).toBe("2026-02-03");
		});

		it("getYesterdayRange returns yesterday only", () => {
			const range = getYesterdayRange();
			expect(range.start).toBe("2026-02-02");
			expect(range.end).toBe("2026-02-02");
		});

		it("getThisWeekRange returns Monday to today", () => {
			// Feb 3, 2026 is Tuesday, so week started Feb 2 (Monday)
			const range = getThisWeekRange();
			expect(range.start).toBe("2026-02-02"); // Monday
			expect(range.end).toBe("2026-02-03"); // Tuesday (today)
		});

		it("getLastWeekRange returns previous Monday to Sunday", () => {
			// Last week was Jan 26 (Mon) to Feb 1 (Sun)
			const range = getLastWeekRange();
			expect(range.start).toBe("2026-01-26");
			expect(range.end).toBe("2026-02-01");
		});

		it("getLastFridayRange on Tuesday returns Friday to today", () => {
			// Feb 3, 2026 is Tuesday, last Friday was Jan 30
			const range = getLastFridayRange();
			expect(range.start).toBe("2026-01-30");
			expect(range.end).toBe("2026-02-03");
		});
	});

	describe("getLastFridayRange on different days", () => {
		afterEach(() => {
			vi.useRealTimers();
		});

		it("on Monday, last Friday was 3 days ago", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 1, 2, 12, 0, 0)); // Monday Feb 2
			const range = getLastFridayRange();
			expect(range.start).toBe("2026-01-30"); // Friday Jan 30
		});

		it("on Friday, last Friday was 7 days ago", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 1, 6, 12, 0, 0)); // Friday Feb 6
			const range = getLastFridayRange();
			expect(range.start).toBe("2026-01-30"); // Friday Jan 30
		});

		it("on Saturday, last Friday was 1 day ago", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 1, 7, 12, 0, 0)); // Saturday Feb 7
			const range = getLastFridayRange();
			expect(range.start).toBe("2026-02-06"); // Friday Feb 6
		});

		it("on Sunday, last Friday was 2 days ago", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 1, 8, 12, 0, 0)); // Sunday Feb 8
			const range = getLastFridayRange();
			expect(range.start).toBe("2026-02-06"); // Friday Feb 6
		});
	});

	describe("UTC Conversion", () => {
		it("localDateToUTCStart converts local midnight to UTC", () => {
			const utc = localDateToUTCStart("2026-02-03");
			// Should be midnight local time converted to UTC
			const parsed = new Date(utc);
			expect(parsed.getHours()).toBe(0);
			expect(parsed.getMinutes()).toBe(0);
			expect(parsed.getDate()).toBe(3);
		});

		it("localDateToUTCEnd converts local 23:59:59 to UTC", () => {
			const utc = localDateToUTCEnd("2026-02-03");
			const parsed = new Date(utc);
			expect(parsed.getHours()).toBe(23);
			expect(parsed.getMinutes()).toBe(59);
		});
	});

	describe("isCommitInDateRange", () => {
		it("returns true for commit within range", () => {
			// Commit at noon on Feb 2 (UTC)
			const commitDate = "2026-02-02T12:00:00Z";
			expect(isCommitInDateRange(commitDate, "2026-02-02", "2026-02-02")).toBe(true);
		});

		it("returns false for commit before range", () => {
			const commitDate = "2026-02-01T12:00:00Z";
			expect(isCommitInDateRange(commitDate, "2026-02-02", "2026-02-02")).toBe(false);
		});

		it("returns false for commit after range", () => {
			const commitDate = "2026-02-03T12:00:00Z";
			expect(isCommitInDateRange(commitDate, "2026-02-02", "2026-02-02")).toBe(false);
		});

		it("handles commit at start of range day (midnight UTC)", () => {
			const commitDate = "2026-02-02T00:00:00Z";
			// In EST (UTC-5), this is Feb 1 at 7pm - should NOT be in Feb 2 range
			// In PST (UTC-8), this is Feb 1 at 4pm - should NOT be in Feb 2 range
			// The test result depends on local timezone!
			const result = isCommitInDateRange(commitDate, "2026-02-02", "2026-02-02");
			
			// This test demonstrates the timezone complexity:
			// The commit is at midnight UTC, which is the previous day in US timezones
			// We expect this to return based on LOCAL interpretation
			const localDate = new Date(commitDate);
			const expectedInRange = localDate.getDate() === 2;
			expect(result).toBe(expectedInRange);
		});

		it("handles multi-day range", () => {
			expect(isCommitInDateRange("2026-02-01T12:00:00Z", "2026-01-30", "2026-02-03")).toBe(true);
			expect(isCommitInDateRange("2026-01-29T12:00:00Z", "2026-01-30", "2026-02-03")).toBe(false);
		});
	});

	describe("Date display bug: new Date(yyyy-MM-dd) vs parseISO(yyyy-MM-dd)", () => {
		it("new Date('yyyy-MM-dd') parses as UTC midnight, causing timezone shift", () => {
			// This is the BUG: new Date() with date-only string is parsed as UTC
			const dateStr = "2026-02-02";
			const buggyDate = new Date(dateStr);
			// In PST (UTC-8), midnight UTC is 4 PM the previous day
			// So format() shows Feb 1 instead of Feb 2
			const buggyFormatted = format(buggyDate, "EEEE, MMM d");
			// This will be "Sunday, Feb 1" in PST - the bug!
			expect(buggyFormatted).not.toBe("Monday, Feb 2");
		});

		it("parseISO('yyyy-MM-dd') correctly treats date as local midnight", () => {
			// This is the FIX: parseISO treats date-only strings as local time
			const dateStr = "2026-02-02";
			const correctDate = parseISO(dateStr);
			const correctFormatted = format(correctDate, "EEEE, MMM d");
			expect(correctFormatted).toBe("Monday, Feb 2");
		});
	});
});
