import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GitHubUser, GitHubRepo, Standup } from "../types";

interface StoreState {
	user: GitHubUser | null;
	accessToken: string | null;
	selectedRepo: GitHubRepo | null;
	standups: Standup[];
	setUser: (user: GitHubUser | null) => void;
	setAccessToken: (token: string | null) => void;
	setSelectedRepo: (repo: GitHubRepo | null) => void;
	loadStandups: () => Promise<void>;
	addStandup: (standup: Standup) => Promise<void>;
	updateStandup: (id: string, standup: Partial<Standup>) => Promise<void>;
	deleteStandup: (id: string) => Promise<void>;
	logout: () => void;
}

export const useStore = create<StoreState>()(
	persist(
		(set, get) => ({
			user: null,
			accessToken: null,
			selectedRepo: null,
			standups: [],

			setUser: (user) => set({ user }),
			setAccessToken: (token) => set({ accessToken: token }),
			setSelectedRepo: (repo) => set({ selectedRepo: repo }),

			loadStandups: async () => {
				const state = get();
				if (!state.user) return;

				try {
					const localStandups = state.standups;

					// Fetch standups from database
					const response = await fetch(
						`/api/standups?userId=${state.user.id}`,
					);
					if (response.ok) {
						const dbStandups = await response.json();

						// If we have local standups but no DB standups, migrate them
						if (
							localStandups.length > 0 &&
							dbStandups.length === 0
						) {
							console.log(
								`Migrating ${localStandups.length} local standups to database...`,
							);

							for (const standup of localStandups) {
								await fetch(
									`/api/standups?userId=${state.user.id}`,
									{
										method: "POST",
										headers: {
											"Content-Type": "application/json",
										},
										body: JSON.stringify({
											...standup,
											taskIds: standup.taskIds || [],
										}),
									},
								);
							}

							// Reload from database after migration
							const reloadResponse = await fetch(
								`/api/standups?userId=${state.user.id}`,
							);
							if (reloadResponse.ok) {
								const migratedStandups =
									await reloadResponse.json();
								set({ standups: migratedStandups });
							}
						} else {
							// Just load from database
							set({ standups: dbStandups });
						}
					}
				} catch (error) {
					console.error("Failed to load standups:", error);
				}
			},

			addStandup: async (standup) => {
				// Add to local state immediately for optimistic UI
				set((state) => ({
					standups: [standup, ...state.standups],
				}));

				// Persist to database
				try {
					const state = get();
					if (!state.user) return;

					const response = await fetch(
						`/api/standups?userId=${state.user.id}`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(standup),
						},
					);

					if (!response.ok) {
						console.error("Failed to save standup to database");
					}
				} catch (error) {
					console.error("Failed to save standup:", error);
				}
			},

			updateStandup: async (id, updates) => {
				// Update local state immediately
				set((state) => ({
					standups: state.standups.map((s) =>
						s.id === id ? { ...s, ...updates } : s,
					),
				}));

				// Persist to database
				try {
					const response = await fetch(`/api/standups/${id}`, {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(updates),
					});

					if (!response.ok) {
						console.error("Failed to update standup in database");
					}
				} catch (error) {
					console.error("Failed to update standup:", error);
				}
			},

			deleteStandup: async (id) => {
				// Remove from local state immediately
				set((state) => ({
					standups: state.standups.filter((s) => s.id !== id),
				}));

				// Delete from database
				try {
					const response = await fetch(`/api/standups/${id}`, {
						method: "DELETE",
					});

					if (!response.ok) {
						console.error("Failed to delete standup from database");
					}
				} catch (error) {
					console.error("Failed to delete standup:", error);
				}
			},

			logout: () =>
				set({
					user: null,
					accessToken: null,
					selectedRepo: null,
					standups: [],
				}),
		}),
		{
			name: "standup-storage",
		},
	),
);
