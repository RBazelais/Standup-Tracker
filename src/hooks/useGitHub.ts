import { useState, useEffect, useMemo } from "react";
import { useStore } from "../store";
import { GitHubService } from "../services/github";
import type { GitHubRepo } from "../types";

export function useGitHub() {
	const { accessToken } = useStore();

	// Use useMemo instead of useState + useEffect
	const github = useMemo(() => {
		return accessToken ? new GitHubService(accessToken) : null;
	}, [accessToken]);

	return github;
}

export function useRepos() {
	const github = useGitHub();
	const [repos, setRepos] = useState<GitHubRepo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRepos = async () => {
			if (!github) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const fetchedRepos = await github.getRepos();
				setRepos(fetchedRepos);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to fetch repos",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchRepos();
	}, [github]);

	return { repos, loading, error };
}
