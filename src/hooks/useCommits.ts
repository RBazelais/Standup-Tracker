import { useState, useEffect } from "react";
import { useGitHub } from "./useGitHub";
import { useStore } from "../store";
import type { GitHubCommit } from "../types";
import { subDays, startOfDay } from "date-fns";

export function useCommits() {
	const github = useGitHub();
	const { selectedRepo } = useStore();
	const [commits, setCommits] = useState<GitHubCommit[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchCommits = async () => {
			if (!github || !selectedRepo) {
				setCommits([]);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				// Get commits since yesterday (start of day)
				const yesterday = startOfDay(subDays(new Date(), 1));

				const [owner, repo] = selectedRepo.full_name.split("/");
				const fetchedCommits = await github.getCommits(
					owner,
					repo,
					yesterday,
				);

				setCommits(fetchedCommits);
			} catch (err) {
				console.error("Failed to fetch commits:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to fetch commits",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchCommits();
	}, [github, selectedRepo]);

	return { commits, loading, error };
}
