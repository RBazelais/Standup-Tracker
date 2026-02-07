import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GitHubUser, GitHubRepo } from "../types";

interface StoreState {
	user: GitHubUser | null;
	accessToken: string | null;
	selectedRepo: GitHubRepo | null;
	selectedBranch: string | null;
	repos: GitHubRepo[];
	setUser: (user: GitHubUser | null) => void;
	setAccessToken: (token: string | null) => void;
	setSelectedRepo: (repo: GitHubRepo | null) => void;
	setSelectedBranch: (branch: string | null) => void;
	setRepos: (repos: GitHubRepo[]) => void;
	logout: () => void;
}

export const useStore = create<StoreState>()(
	persist(
		(set) => ({
			user: null,
			accessToken: null,
			selectedRepo: null,
			selectedBranch: null,
			repos: [],

			setUser: (user) => set({ user }),
			setAccessToken: (token) => set({ accessToken: token }),
			setSelectedRepo: (repo) => set({ selectedRepo: repo }),
			setSelectedBranch: (branch) => set({ selectedBranch: branch }),
			setRepos: (repos) => set({ repos }),

			logout: () =>
				set({
					user: null,
					accessToken: null,
					selectedRepo: null,
					selectedBranch: null,
					repos: [],
				}),
		}),
		{
			name: "standup-storage",
		},
	),
);
