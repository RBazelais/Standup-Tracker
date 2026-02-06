import { useState, useEffect, useCallback } from "react";
import { useStore } from "../store";
import type { GitHubCommit } from "../types";

export function useCommits(since?: string, until?: string) {
	const { selectedRepo, selectedBranch, accessToken } = useStore();
	const [commits, setCommits] = useState<GitHubCommit[]>([]);
	const [loading, setLoading] = useState(false);

	const fetchCommits = useCallback(async () => {
		if (!selectedRepo || !accessToken) {
			setCommits([]);
			return;
		}

		setLoading(true);

		try {
			const params = new URLSearchParams();
			if (selectedBranch) {
				params.append("sha", selectedBranch);
			}
			if (since) {
				// Convert local date to UTC - start of day in local timezone
				const sinceDate = new Date(`${since}T00:00:00`);
				params.append("since", sinceDate.toISOString());
			}
			if (until) {
				// Convert local date to UTC - end of day in local timezone
				const untilDate = new Date(`${until}T23:59:59`);
				params.append("until", untilDate.toISOString());
			}

			const response = await fetch(
				`https://api.github.com/repos/${selectedRepo.full_name}/commits?${params.toString()}`,
				{
					headers: {
						Authorization: `token ${accessToken}`,
						Accept: "application/vnd.github.v3+json",
					},
				},
			);

			if (!response.ok) {
				// 409 = empty repo (no commits), treat as empty array
				if (response.status === 409) {
					setCommits([]);
					return;
				}
				throw new Error("Failed to fetch commits");
			}

			const data = await response.json();
			setCommits(data);
		} catch (error) {
			console.error("Error fetching commits:", error);
			setCommits([]);
		} finally {
			setLoading(false);
		}
	}, [selectedRepo, selectedBranch, accessToken, since, until]);

	useEffect(() => {
		fetchCommits();
	}, [fetchCommits]);

	const refetchCommits = () => {
		fetchCommits();
	};

	return { commits, loading, refetchCommits };
}
