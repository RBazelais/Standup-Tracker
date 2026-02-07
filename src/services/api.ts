import type { Standup, Milestone, Sprint, Task } from "../types";
import { handleApiResponse } from "../lib/errors";

// ==================== STANDUPS ====================
export const standupsApi = {
	getAll: async (userId: string): Promise<Standup[]> => {
		const response = await fetch(`/api/standups?userId=${userId}`);
		return handleApiResponse<Standup[]>(response);
	},

	getById: async (id: string): Promise<Standup> => {
		const response = await fetch(`/api/standups/${id}`);
		return handleApiResponse<Standup>(response);
	},

	create: async (
		userId: string,
		standup: Omit<Standup, "id" | "createdAt">,
	): Promise<Standup> => {
		const response = await fetch(`/api/standups?userId=${userId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(standup),
		});
		return handleApiResponse<Standup>(response);
	},

	update: async (id: string, updates: Partial<Standup>): Promise<Standup> => {
		const response = await fetch(`/api/standups/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		return handleApiResponse<Standup>(response);
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`/api/standups/${id}`, {
			method: "DELETE",
		});
		return handleApiResponse<void>(response);
	},
};

// ==================== MILESTONES ====================
export const milestonesApi = {
	getAll: async (userId: string): Promise<Milestone[]> => {
		const response = await fetch(`/api/milestones?userId=${userId}`);
		return handleApiResponse<Milestone[]>(response);
	},

	create: async (
		userId: string,
		milestone: Omit<Milestone, "id" | "createdAt">,
	): Promise<Milestone> => {
		const response = await fetch(`/api/milestones?userId=${userId}`, {
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
		const response = await fetch(`/api/milestones/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		return handleApiResponse<Milestone>(response);
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`/api/milestones/${id}`, {
			method: "DELETE",
		});
		return handleApiResponse<void>(response);
	},
};

// ==================== SPRINTS ====================
export const sprintsApi = {
	getAll: async (userId: string): Promise<Sprint[]> => {
		const response = await fetch(`/api/sprints?userId=${userId}`);
		return handleApiResponse<Sprint[]>(response);
	},

	create: async (
		userId: string,
		sprint: Omit<Sprint, "id" | "createdAt">,
	): Promise<Sprint> => {
		const response = await fetch(`/api/sprints?userId=${userId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(sprint),
		});
		return handleApiResponse<Sprint>(response);
	},

	update: async (id: string, updates: Partial<Sprint>): Promise<Sprint> => {
		const response = await fetch(`/api/sprints/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		return handleApiResponse<Sprint>(response);
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`/api/sprints/${id}`, {
			method: "DELETE",
		});
		return handleApiResponse<void>(response);
	},
};

// ==================== TASKS ====================
export const tasksApi = {
	getAll: async (userId: string): Promise<Task[]> => {
		const response = await fetch(`/api/tasks?userId=${userId}`);
		return handleApiResponse<Task[]>(response);
	},

	create: async (
		userId: string,
		task: Omit<Task, "id" | "createdAt">,
	): Promise<Task> => {
		const response = await fetch(`/api/tasks?userId=${userId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(task),
		});
		return handleApiResponse<Task>(response);
	},

	update: async (id: string, updates: Partial<Task>): Promise<Task> => {
		const response = await fetch(`/api/tasks/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		return handleApiResponse<Task>(response);
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`/api/tasks/${id}`, {
			method: "DELETE",
		});
		return handleApiResponse<void>(response);
	},
};
