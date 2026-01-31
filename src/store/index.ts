import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GitHubUser, GitHubRepo, Standup, Milestone, Sprint, Task } from "../types";

interface StoreState {
	user: GitHubUser | null;
	accessToken: string | null;
	selectedRepo: GitHubRepo | null;
	standups: Standup[];
	milestones: Milestone[];
	sprints: Sprint[];
	tasks: Task[];
	setUser: (user: GitHubUser | null) => void;
	setAccessToken: (token: string | null) => void;
	setSelectedRepo: (repo: GitHubRepo | null) => void;
	// Standup methods
	loadStandups: () => Promise<void>;
	addStandup: (standup: Standup) => Promise<void>;
	updateStandup: (id: string, standup: Partial<Standup>) => Promise<void>;
	deleteStandup: (id: string) => Promise<void>;
	// Milestone methods
	loadMilestones: () => Promise<void>;
	addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt'>) => Promise<void>;
	updateMilestone: (id: string, milestone: Partial<Milestone>) => Promise<void>;
	deleteMilestone: (id: string) => Promise<void>;
	// Sprint methods
	loadSprints: () => Promise<void>;
	addSprint: (sprint: Omit<Sprint, 'id' | 'createdAt'>) => Promise<void>;
	updateSprint: (id: string, sprint: Partial<Sprint>) => Promise<void>;
	deleteSprint: (id: string) => Promise<void>;
	// Task methods
	loadTasks: () => Promise<void>;
	addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
	updateTask: (id: string, task: Partial<Task>) => Promise<void>;
	deleteTask: (id: string) => Promise<void>;
	logout: () => void;
}

export const useStore = create<StoreState>()(
	persist(
		(set, get) => ({
			user: null,
			accessToken: null,
			selectedRepo: null,
			standups: [],
			milestones: [],
			sprints: [],
			tasks: [],

			setUser: (user) => set({ user }),
			setAccessToken: (token) => set({ accessToken: token }),
			setSelectedRepo: (repo) => set({ selectedRepo: repo }),

			// ==================== STANDUP METHODS ====================
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
				const clientId = standup.id;
				
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

					if (response.ok) {
						// Update local state with server-generated ID
						const savedStandup = await response.json();
						set((state) => ({
							standups: state.standups.map((s) =>
								s.id === clientId ? { ...s, id: savedStandup.id } : s,
							),
						}));
					} else {
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

			// ==================== MILESTONE METHODS ====================
			loadMilestones: async () => {
				const state = get();
				if (!state.user) return;

				try {
					const response = await fetch(
						`/api/milestones?userId=${state.user.id}`,
					);
					if (response.ok) {
						const dbMilestones = await response.json();
						set({ milestones: dbMilestones });
					}
				} catch (error) {
					console.error("Failed to load milestones:", error);
				}
			},

			addMilestone: async (milestone) => {
				const state = get();
				if (!state.user) return;

				try {
					const response = await fetch(
						`/api/milestones?userId=${state.user.id}`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(milestone),
						},
					);

					if (response.ok) {
						const newMilestone = await response.json();
						set((state) => ({
							milestones: [newMilestone, ...state.milestones],
						}));
					}
				} catch (error) {
					console.error("Failed to create milestone:", error);
				}
			},

			updateMilestone: async (id, updates) => {
				// Update local state immediately
				set((state) => ({
					milestones: state.milestones.map((m) =>
						m.id === id ? { ...m, ...updates } : m,
					),
				}));

				// Persist to database
				try {
					const response = await fetch(`/api/milestones/${id}`, {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(updates),
					});

					if (!response.ok) {
						console.error("Failed to update milestone in database");
					}
				} catch (error) {
					console.error("Failed to update milestone:", error);
				}
			},

			deleteMilestone: async (id) => {
				// Remove from local state immediately
				set((state) => ({
					milestones: state.milestones.filter((m) => m.id !== id),
				}));

				// Delete from database
				try {
					const response = await fetch(`/api/milestones/${id}`, {
						method: "DELETE",
					});

					if (!response.ok) {
						console.error("Failed to delete milestone from database");
					}
				} catch (error) {
					console.error("Failed to delete milestone:", error);
				}
			},

			// ==================== SPRINT METHODS ====================
			loadSprints: async () => {
				const state = get();
				if (!state.user) return;

				try {
					const response = await fetch(
						`/api/sprints?userId=${state.user.id}`,
					);
					if (response.ok) {
						const dbSprints = await response.json();
						set({ sprints: dbSprints });
					}
				} catch (error) {
					console.error("Failed to load sprints:", error);
				}
			},

			addSprint: async (sprint) => {
				const state = get();
				if (!state.user) return;

				try {
					const response = await fetch(
						`/api/sprints?userId=${state.user.id}`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(sprint),
						},
					);

					if (response.ok) {
						const newSprint = await response.json();
						set((state) => ({
							sprints: [newSprint, ...state.sprints],
						}));
					}
				} catch (error) {
					console.error("Failed to create sprint:", error);
				}
			},

			updateSprint: async (id, updates) => {
				// Update local state immediately
				set((state) => ({
					sprints: state.sprints.map((s) =>
						s.id === id ? { ...s, ...updates } : s,
					),
				}));

				// Persist to database
				try {
					const response = await fetch(`/api/sprints/${id}`, {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(updates),
					});

					if (!response.ok) {
						console.error("Failed to update sprint in database");
					}
				} catch (error) {
					console.error("Failed to update sprint:", error);
				}
			},

			deleteSprint: async (id) => {
				// Remove from local state immediately
				set((state) => ({
					sprints: state.sprints.filter((s) => s.id !== id),
				}));

				// Delete from database
				try {
					const response = await fetch(`/api/sprints/${id}`, {
						method: "DELETE",
					});

					if (!response.ok) {
						console.error("Failed to delete sprint from database");
					}
				} catch (error) {
					console.error("Failed to delete sprint:", error);
				}
			},

			// ==================== TASK METHODS ====================
			loadTasks: async () => {
				const state = get();
				if (!state.user) return;

				try {
					const response = await fetch(
						`/api/tasks?userId=${state.user.id}`,
					);
					if (response.ok) {
						const dbTasks = await response.json();
						set({ tasks: dbTasks });
					}
				} catch (error) {
					console.error("Failed to load tasks:", error);
				}
			},

			addTask: async (task) => {
				const state = get();
				if (!state.user) return;

				try {
					const response = await fetch(
						`/api/tasks?userId=${state.user.id}`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(task),
						},
					);

					if (response.ok) {
						const newTask = await response.json();
						set((state) => ({
							tasks: [newTask, ...state.tasks],
						}));
					}
				} catch (error) {
					console.error("Failed to create task:", error);
				}
			},

			updateTask: async (id, updates) => {
				// Update local state immediately
				set((state) => ({
					tasks: state.tasks.map((t) =>
						t.id === id ? { ...t, ...updates } : t,
					),
				}));

				// Persist to database
				try {
					const response = await fetch(`/api/tasks/${id}`, {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(updates),
					});

					if (!response.ok) {
						console.error("Failed to update task in database");
					}
				} catch (error) {
					console.error("Failed to update task:", error);
				}
			},

			deleteTask: async (id) => {
				// Remove from local state immediately
				set((state) => ({
					tasks: state.tasks.filter((t) => t.id !== id),
				}));

				// Delete from database
				try {
					const response = await fetch(`/api/tasks/${id}`, {
						method: "DELETE",
					});

					if (!response.ok) {
						console.error("Failed to delete task from database");
					}
				} catch (error) {
					console.error("Failed to delete task:", error);
				}
			},

			logout: () =>
				set({
					user: null,
					accessToken: null,
					selectedRepo: null,
					standups: [],
					milestones: [],
					sprints: [],
					tasks: [],
				}),
		}),
		{
			name: "standup-storage",
		},
	),
);
