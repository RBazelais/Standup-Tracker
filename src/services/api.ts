import type { Standup, CreateStandupInput, UpdateStandupInput, Milestone, Sprint, Task } from "@/types";
import { handleApiResponse } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";

// ==================== STANDUPS ====================
export const standupsApi = {
	getAll: async (userId: string): Promise<Standup[]> => {
		const response = await fetchWithTimeout(`/api/standups?userId=${userId}`);
		return handleApiResponse<Standup[]>(response);
	},

	getById: async (id: string): Promise<Standup> => {
		const response = await fetchWithTimeout(`/api/standups/${id}`);
		return handleApiResponse<Standup>(response);
	},

	create: async (
		userId: string,
		standup: CreateStandupInput,
	): Promise<Standup> => {
		const response = await fetchWithTimeout(`/api/standups?userId=${userId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(standup),
		});
		return handleApiResponse<Standup>(response);
	},

	update: async (id: string, updates: UpdateStandupInput): Promise<Standup> => {
		const response = await fetchWithTimeout(`/api/standups/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		return handleApiResponse<Standup>(response);
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetchWithTimeout(`/api/standups/${id}`, {
			method: "DELETE",
		});
		return handleApiResponse<void>(response);
	},
};

// ==================== MILESTONES ====================
export const milestonesApi = {
	getAll: async (userId: string): Promise<Milestone[]> => {
		const response = await fetchWithTimeout(`/api/milestones?userId=${userId}`);
		return handleApiResponse<Milestone[]>(response);
	},

	create: async (
		userId: string,
		milestone: Omit<Milestone, "id" | "createdAt">,
	): Promise<Milestone> => {
		const response = await fetchWithTimeout(`/api/milestones?userId=${userId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(milestone),
		});
		return handleApiResponse<Milestone>(response);
	},

	update: async (
		id: string,
		updates: Partial<Milestone>,
	): Promise<Milestone> => {
		const response = await fetchWithTimeout(`/api/milestones/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		return handleApiResponse<Milestone>(response);
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetchWithTimeout(`/api/milestones/${id}`, {
			method: "DELETE",
		});
		return handleApiResponse<void>(response);
	},
};

// ==================== SPRINTS ====================
export const sprintsApi = {
	getAll: async (userId: string): Promise<Sprint[]> => {
		const response = await fetchWithTimeout(`/api/sprints?userId=${userId}`);
		return handleApiResponse<Sprint[]>(response);
	},

	create: async (
		userId: string,
		sprint: Omit<Sprint, "id" | "createdAt">,
	): Promise<Sprint> => {
		const response = await fetchWithTimeout(`/api/sprints?userId=${userId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(sprint),
		});
		return handleApiResponse<Sprint>(response);
	},

	update: async (id: string, updates: Partial<Sprint>): Promise<Sprint> => {
		const response = await fetchWithTimeout(`/api/sprints/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		return handleApiResponse<Sprint>(response);
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetchWithTimeout(`/api/sprints/${id}`, {
			method: "DELETE",
		});
		return handleApiResponse<void>(response);
	},
};

// ==================== TASKS ====================
export const tasksApi = {
	getAll: async (userId: string): Promise<Task[]> => {
		const response = await fetchWithTimeout(`/api/tasks?userId=${userId}`);
		return handleApiResponse<Task[]>(response);
	},

	create: async (
		userId: string,
		task: Omit<Task, "id" | "createdAt">,
	): Promise<Task> => {
		const response = await fetchWithTimeout(`/api/tasks?userId=${userId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(task),
		});
		return handleApiResponse<Task>(response);
	},

	update: async (id: string, updates: Partial<Task>): Promise<Task> => {
		const response = await fetchWithTimeout(`/api/tasks/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		return handleApiResponse<Task>(response);
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetchWithTimeout(`/api/tasks/${id}`, {
			method: "DELETE",
		});
		return handleApiResponse<void>(response);
	},
};
