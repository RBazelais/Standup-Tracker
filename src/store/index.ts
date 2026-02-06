import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GitHubUser, GitHubRepo } from "../types";

interface StoreState {
	user: GitHubUser | null;
	accessToken: string | null;
	selectedRepo: GitHubRepo | null;
	selectedBranch: string | null;
	repos: GitHubRepo[];
	standups: import("../types").Standup[];
	loadStandups: () => Promise<void>;
	addStandup: (standup: import("../types").Standup) => Promise<void>;
	setUser: (user: GitHubUser | null) => void;
	setAccessToken: (token: string | null) => void;
	setSelectedRepo: (repo: GitHubRepo | null) => void;
	setSelectedBranch: (branch: string | null) => void;
	setRepos: (repos: GitHubRepo[]) => void;
	logout: () => void;
}

export const useStore = create<StoreState>()(
	persist(
		(set, get) => ({
			user: null,
			accessToken: null,
			selectedRepo: null,
			selectedBranch: null,
			repos: [],
			standups: [],

			setUser: (user) => set({ user }),
			setAccessToken: (token) => set({ accessToken: token }),
			setSelectedRepo: (repo) => set({ selectedRepo: repo }),
			setSelectedBranch: (branch) => set({ selectedBranch: branch }),
			setRepos: (repos) => set({ repos }),

			loadStandups: async () => {
				const current = get();
				const user = current.user;
				if (!user) return;
				try {
					const res = await fetch(`/api/standups?userId=${user.id}`);
					if (!res.ok) throw new Error("Failed to load standups");
					const data = await res.json();
					set({ standups: data });
				} catch (err) {
					console.error("Failed to load standups:", err);
				}
			},

			addStandup: async (standup) => {
				const current = get();
				const user = current.user;
				if (!user) throw new Error("No user");
				try {
					const res = await fetch(`/api/standups?userId=${user.id}`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(standup),
					});
					if (!res.ok) throw new Error("Failed to add standup");
					const created = await res.json();
					set((s) => ({ standups: [created, ...(s.standups || [])] }));
				} catch (err) {
					console.error("Failed to add standup:", err);
				}
			},

			logout: () =>
				set({
					user: null,
					accessToken: null,
					selectedRepo: null,
					selectedBranch: null,
					repos: [],
					standups: [],
				}),
		}),
		{
			name: "standup-storage",
		},
	),
);
