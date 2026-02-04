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
				params.append("since", `${since}T00:00:00Z`);
			}
			if (until) {
				params.append("until", `${until}T23:59:59Z`);
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
