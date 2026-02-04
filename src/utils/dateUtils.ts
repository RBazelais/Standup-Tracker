import { format, subDays, startOfWeek, endOfWeek, subWeeks } from "date-fns";

/**
 * Get date string in yyyy-MM-dd format for a given date
 */
export function toDateString(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

/**
 * Get today's date as yyyy-MM-dd string
 */
export function getToday(): string {
	return toDateString(new Date());
}

/**
 * Get yesterday's date as yyyy-MM-dd string
 */
export function getYesterday(): string {
	return toDateString(subDays(new Date(), 1));
}

/**
 * Date range presets for commit filtering
 */
export interface DateRange {
	start: string; // yyyy-MM-dd
	end: string; // yyyy-MM-dd
}

/**
 * Get date range for "Today" - only today
 */
export function getTodayRange(): DateRange {
	const today = getToday();
	return { start: today, end: today };
}

/**
 * Get date range for "Yesterday" - only yesterday
 */
export function getYesterdayRange(): DateRange {
	const yesterday = getYesterday();
	return { start: yesterday, end: yesterday };
}

/**
 * Get date range for "This Week" - Monday to today
 */
export function getThisWeekRange(): DateRange {
	const today = new Date();
	const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
	return {
		start: toDateString(weekStart),
		end: toDateString(today),
	};
}

/**
 * Get date range for "Last Week" - Previous Monday to Sunday
 */
export function getLastWeekRange(): DateRange {
	const today = new Date();
	const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
	const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
	return {
		start: toDateString(lastWeekStart),
		end: toDateString(lastWeekEnd),
	};
}

/**
 * Get date range for "Last Friday" - Last Friday to today
 */
export function getLastFridayRange(): DateRange {
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
	
	// Calculate days since last Friday
	// If today is Sunday (0), last Friday was 2 days ago
	// If today is Monday (1), last Friday was 3 days ago
	// If today is Tuesday (2), last Friday was 4 days ago
	// If today is Friday (5), last Friday was 7 days ago (previous Friday)
	// If today is Saturday (6), last Friday was 1 day ago
	let daysToLastFriday: number;
	if (dayOfWeek === 0) {
		daysToLastFriday = 2; // Sunday -> Friday
	} else if (dayOfWeek <= 5) {
		daysToLastFriday = dayOfWeek + 2; // Mon-Fri -> previous Friday
	} else {
		daysToLastFriday = 1; // Saturday -> Friday
	}
	
	const lastFriday = subDays(today, daysToLastFriday);
	return {
		start: toDateString(lastFriday),
		end: toDateString(today),
	};
}

/**
 * Convert local date string to UTC ISO string for start of day
 * Used when calling GitHub API
 */
export function localDateToUTCStart(dateStr: string): string {
	const date = new Date(`${dateStr}T00:00:00`);
	return date.toISOString();
}

/**
 * Convert local date string to UTC ISO string for end of day
 * Used when calling GitHub API
 */
export function localDateToUTCEnd(dateStr: string): string {
	const date = new Date(`${dateStr}T23:59:59`);
	return date.toISOString();
}

/**
 * Check if a commit date (ISO string) falls within a local date range
 */
export function isCommitInDateRange(
	commitDateISO: string,
	startDate: string,
	endDate: string,
): boolean {
	// Convert commit's UTC date to local date string
	const commitLocalDate = toDateString(new Date(commitDateISO));
	return commitLocalDate >= startDate && commitLocalDate <= endDate;
}
