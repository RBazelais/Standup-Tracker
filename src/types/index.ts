export interface GitHubUser {
	login: string;
	name: string;
	avatar_url: string;
	id: number;
}

export interface GitHubRepo {
	id: number;
	name: string;
	full_name: string;
	owner: {
		login: string;
	};
	private: boolean;
}

export interface GitHubCommit {
	sha: string;
	commit: {
		message: string;
		author: {
			name: string;
			date: string;
		} | null; // ← Can be null!
	};
	files?: Array<{
		// ← Optional (merge commits have no files)
		filename: string;
		additions: number;
		deletions: number;
		changes: number;
	}>;
}

export interface Standup {
	id: string;
	date: string;
	yesterday: string;
	today: string;
	blockers: string;
	goalIds: string[];
	commits: GitHubCommit[];
	repoFullName?: string;
	createdAt: string;
}

export interface Goal {
	id: string;
	title: string;
	description: string;
	targetDate?: string;
	createdAt: string;
	completedAt?: string;
}

export interface AppState {
	user: GitHubUser | null;
	accessToken: string | null;
	selectedRepo: GitHubRepo | null;
	standups: Standup[];
	goals: Goal[];
}
