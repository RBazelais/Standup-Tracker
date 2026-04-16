import { format } from "date-fns";
import { isCommitInDateRange } from "./dateUtils";
import type { GitHubCommit } from "@/types";

/**
 * Filter commits to those whose author date falls within a local date range.
 * Delegates to isCommitInDateRange for consistent timezone handling.
 */
export function filterCommitsByDateRange(
	commits: GitHubCommit[],
	startDate: string,
	endDate: string,
): GitHubCommit[] {
	return commits.filter((commit) => {
		const date = commit.commit.author?.date;
		if (!date) return false;
		return isCommitInDateRange(date, startDate, endDate);
	});
}

/**
 * Group commits by local calendar day (yyyy-MM-dd), sorting within each day
 * by author timestamp.
 */
export function groupCommitsByDay(
	commits: GitHubCommit[],
	oldestFirst: boolean,
): Record<string, GitHubCommit[]> {
	const grouped = commits.reduce(
		(acc, commit) => {
			const date = format(
				new Date(commit.commit.author?.date || new Date()),
				"yyyy-MM-dd",
			);
			if (!acc[date]) acc[date] = [];
			acc[date].push(commit);
			return acc;
		},
		{} as Record<string, GitHubCommit[]>,
	);

	for (const date in grouped) {
		grouped[date].sort((a, b) => {
			const timeA = new Date(a.commit.author?.date || 0).getTime();
			const timeB = new Date(b.commit.author?.date || 0).getTime();
			return oldestFirst ? timeA - timeB : timeB - timeA;
		});
	}

	return grouped;
}

/**
 * Build the "work completed" text from a list of selected commits.
 * Each line: "<first line of message> (`<short sha>`)"
 */
export function buildAutoPopulateText(commits: GitHubCommit[]): string {
	return commits
		.map((commit) => {
			const message = commit.commit.message.split("\n")[0];
			const sha = commit.sha.substring(0, 7);
			return `${message} (\`${sha}\`)`;
		})
		.join("\n");
}
