import { useState, useEffect } from "react";
import { useStore } from "../store";

export function useBranches() {
	const { selectedRepo, accessToken } = useStore();
	const [branches, setBranches] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchBranches = async () => {
			if (!selectedRepo || !accessToken) {
				setBranches([]);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const response = await fetch(
					`https://api.github.com/repos/${selectedRepo.full_name}/branches`,
					{
						headers: {
							Authorization: `token ${accessToken}`,
							Accept: "application/vnd.github.v3+json",
						},
					},
				);

				if (!response.ok) {
					throw new Error("Failed to fetch branches");
				}

				const data = await response.json();
				setBranches(
					data.map((branch: { name: string }) => branch.name),
				);
			} catch (err) {
				console.error("Error fetching branches:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to fetch branches",
				);
				setBranches([]);
			} finally {
				setLoading(false);
			}
		};

		fetchBranches();
	}, [selectedRepo, accessToken]);

	return { branches, loading, error };
}
