import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppState, GitHubUser, GitHubRepo, Standup, Goal } from "../types";

interface StoreState extends AppState {
	setUser: (user: GitHubUser | null) => void;
	setAccessToken: (token: string | null) => void;
	setSelectedRepo: (repo: GitHubRepo | null) => void;
	addStandup: (standup: Standup) => void;
	updateStandup: (id: string, standup: Partial<Standup>) => void;
	deleteStandup: (id: string) => void;
	addGoal: (goal: Goal) => void;
	updateGoal: (id: string, goal: Partial<Goal>) => void;
	deleteGoal: (id: string) => void;
	logout: () => void;
}

export const useStore = create<StoreState>()(
	persist(
		(set) => ({
			user: null,
			accessToken: null,
			selectedRepo: null,
			standups: [],
			goals: [],

			setUser: (user) => set({ user }),
			setAccessToken: (token) => set({ accessToken: token }),
			setSelectedRepo: (repo) => set({ selectedRepo: repo }),

			addStandup: (standup) =>
				set((state) => ({
					standups: [standup, ...state.standups],
				})),

			updateStandup: (id, updates) =>
				set((state) => ({
					standups: state.standups.map((s) =>
						s.id === id ? { ...s, ...updates } : s,
					),
				})),

			deleteStandup: (id) =>
				set((state) => ({
					standups: state.standups.filter((s) => s.id !== id),
				})),

			addGoal: (goal) =>
				set((state) => ({
					goals: [goal, ...state.goals],
				})),

			updateGoal: (id, updates) =>
				set((state) => ({
					goals: state.goals.map((g) =>
						g.id === id ? { ...g, ...updates } : g,
					),
				})),

			deleteGoal: (id) =>
				set((state) => ({
					goals: state.goals.filter((g) => g.id !== id),
				})),

			logout: () =>
				set({
					user: null,
					accessToken: null,
					selectedRepo: null,
				}),
		}),
		{
			name: "standup-storage",
		},
	),
);
