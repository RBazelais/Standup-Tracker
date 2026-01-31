import { useState, useEffect, useCallback } from "react";
import { useGitHub } from "./useGitHub";
import { useStore } from "../store";
import type { GitHubCommit } from "../types";
import { subDays, startOfDay } from "date-fns";

// Accept optional date range strings (yyyy-MM-dd) so callers can control
// which commits to fetch. Returns a refetch function for manual refresh.
export function useCommits(startDate?: string, endDate?: string) {
	const github = useGitHub();
	const { selectedRepo } = useStore();
	const [commits, setCommits] = useState<GitHubCommit[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchCommits = useCallback(async () => {
		if (!github || !selectedRepo) {
			setCommits([]);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			// Determine since / until from provided strings or sensible defaults
			const since = startDate ? new Date(startDate) : startOfDay(subDays(new Date(), 1));
			const until = endDate ? new Date(endDate) : undefined;

			const [owner, repo] = selectedRepo.full_name.split("/");
			const fetchedCommits = await github.getCommits(owner, repo, since, until);

			setCommits(fetchedCommits);
		} catch (err) {
			console.error("Failed to fetch commits:", err);
			setError(err instanceof Error ? err.message : "Failed to fetch commits");
		} finally {
			setLoading(false);
		}
	}, [github, selectedRepo, startDate, endDate]);

	useEffect(() => {
		fetchCommits();
	}, [fetchCommits]);

	return { commits, loading, error, refetchCommits: fetchCommits };
}
