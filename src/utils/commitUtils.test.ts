import { describe, it, expect } from "vitest";
import {
	filterCommitsByDateRange,
	groupCommitsByDay,
	buildAutoPopulateText,
} from "./commitUtils";
import type { GitHubCommit } from "../types";

function makeCommit(sha: string, date: string, message = "fix: something"): GitHubCommit {
	return {
		sha,
		commit: { message, author: { name: "Dev", date } },
	};
}

describe("filterCommitsByDateRange", () => {
	it("keeps commits within the range", () => {
		const commits = [
			makeCommit("aaa", "2026-02-02T12:00:00Z"),
			makeCommit("bbb", "2026-02-03T12:00:00Z"),
		];
		const result = filterCommitsByDateRange(commits, "2026-02-02", "2026-02-03");
		expect(result.map((c) => c.sha)).toEqual(["aaa", "bbb"]);
	});

	it("excludes commits outside the range", () => {
		const commits = [
			makeCommit("aaa", "2026-02-01T12:00:00Z"),
			makeCommit("bbb", "2026-02-02T12:00:00Z"),
			makeCommit("ccc", "2026-02-04T12:00:00Z"),
		];
		const result = filterCommitsByDateRange(commits, "2026-02-02", "2026-02-03");
		expect(result.map((c) => c.sha)).toEqual(["bbb"]);
	});

	it("excludes commits with no author date", () => {
		const commit: GitHubCommit = {
			sha: "zzz",
			commit: { message: "feat: something", author: {} },
		};
		expect(filterCommitsByDateRange([commit], "2026-02-02", "2026-02-03")).toEqual([]);
	});

	it("returns empty array for empty input", () => {
		expect(filterCommitsByDateRange([], "2026-02-02", "2026-02-03")).toEqual([]);
	});
});

describe("groupCommitsByDay", () => {
	const commits = [
		makeCommit("aaa", "2026-02-02T09:00:00Z"),
		makeCommit("bbb", "2026-02-02T11:00:00Z"),
		makeCommit("ccc", "2026-02-03T10:00:00Z"),
	];

	it("groups commits by local date", () => {
		const groups = groupCommitsByDay(commits, true);
		const dates = Object.keys(groups).sort();
		expect(dates).toHaveLength(2);
		expect(groups[dates[0]]).toHaveLength(2);
		expect(groups[dates[1]]).toHaveLength(1);
	});

	it("sorts oldest first within a day", () => {
		const groups = groupCommitsByDay(commits, true);
		const date = Object.keys(groups).find((d) => groups[d].length === 2)!;
		expect(groups[date][0].sha).toBe("aaa");
		expect(groups[date][1].sha).toBe("bbb");
	});

	it("sorts newest first within a day", () => {
		const groups = groupCommitsByDay(commits, false);
		const date = Object.keys(groups).find((d) => groups[d].length === 2)!;
		expect(groups[date][0].sha).toBe("bbb");
		expect(groups[date][1].sha).toBe("aaa");
	});

	it("returns empty object for empty input", () => {
		expect(groupCommitsByDay([], true)).toEqual({});
	});
});

describe("buildAutoPopulateText", () => {
	it("formats each commit as first-line message + short sha", () => {
		const commits = [
			makeCommit("abcdef1234567", "2026-02-02T10:00:00Z", "feat: add login"),
			makeCommit("1234567abcdef", "2026-02-02T11:00:00Z", "fix: broken link"),
		];
		const text = buildAutoPopulateText(commits);
		expect(text).toBe(
			"feat: add login (`abcdef1`)\nfix: broken link (`1234567`)",
		);
	});

	it("uses only the first line of multi-line commit messages", () => {
		const commit = makeCommit(
			"abc1234",
			"2026-02-02T10:00:00Z",
			"feat: new thing\n\nDetailed description here.",
		);
		expect(buildAutoPopulateText([commit])).toBe("feat: new thing (`abc1234`)");
	});

	it("returns empty string for empty input", () => {
		expect(buildAutoPopulateText([])).toBe("");
	});
});
