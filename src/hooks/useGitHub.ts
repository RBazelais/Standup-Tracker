import { useMemo } from "react";
import { useStore } from "../store";
import { GitHubService } from "../services/github";

export function useGitHub() {
	const { accessToken } = useStore();

	const github = useMemo(() => {
		return accessToken ? new GitHubService(accessToken) : null;
	}, [accessToken]);

	return github;
}
