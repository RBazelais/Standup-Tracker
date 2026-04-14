import { Octokit } from "@octokit/rest";
import type { GitHubRepo, GitHubUser } from "../types";

export class GitHubService {
	private octokit: Octokit;

	constructor(accessToken: string) {
		this.octokit = new Octokit({ auth: accessToken });
	}

	async getUser(): Promise<GitHubUser> {
		const { data } = await this.octokit.users.getAuthenticated();
		return {
			login: data.login,
			name: data.name || data.login,
			avatar_url: data.avatar_url,
			id: data.id,
		};
	}

	async getRepos(): Promise<GitHubRepo[]> {
		const { data } = await this.octokit.repos.listForAuthenticatedUser({
			sort: "updated",
			per_page: 100,
		});
		return data;
	}

}
