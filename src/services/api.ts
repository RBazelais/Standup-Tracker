import type { Standup, Milestone, Sprint, Task } from "../types";

// ==================== STANDUPS ====================
export const standupsApi = {
	getAll: async (userId: string): Promise<Standup[]> => {
		const response = await fetch(`/api/standups?userId=${userId}`);
		if (!response.ok) throw new Error("Failed to fetch standups");
		return response.json();
	},

	getById: async (id: string): Promise<Standup> => {
		const response = await fetch(`/api/standups/${id}`);
		if (!response.ok) throw new Error("Failed to fetch standup");
		return response.json();
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
		if (!response.ok) throw new Error("Failed to create standup");
		return response.json();
	},

	update: async (id: string, updates: Partial<Standup>): Promise<Standup> => {
		const response = await fetch(`/api/standups/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		if (!response.ok) throw new Error("Failed to update standup");
		return response.json();
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`/api/standups/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) throw new Error("Failed to delete standup");
	},
};

// ==================== MILESTONES ====================
export const milestonesApi = {
	getAll: async (userId: string): Promise<Milestone[]> => {
		const response = await fetch(`/api/milestones?userId=${userId}`);
		if (!response.ok) throw new Error("Failed to fetch milestones");
		return response.json();
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
		if (!response.ok) throw new Error("Failed to create milestone");
		return response.json();
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
		if (!response.ok) throw new Error("Failed to update milestone");
		return response.json();
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`/api/milestones/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) throw new Error("Failed to delete milestone");
	},
};

// ==================== SPRINTS ====================
export const sprintsApi = {
	getAll: async (userId: string): Promise<Sprint[]> => {
		const response = await fetch(`/api/sprints?userId=${userId}`);
		if (!response.ok) throw new Error("Failed to fetch sprints");
		return response.json();
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
		if (!response.ok) throw new Error("Failed to create sprint");
		return response.json();
	},

	update: async (id: string, updates: Partial<Sprint>): Promise<Sprint> => {
		const response = await fetch(`/api/sprints/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		if (!response.ok) throw new Error("Failed to update sprint");
		return response.json();
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`/api/sprints/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) throw new Error("Failed to delete sprint");
	},
};

// ==================== TASKS ====================
export const tasksApi = {
	getAll: async (userId: string): Promise<Task[]> => {
		const response = await fetch(`/api/tasks?userId=${userId}`);
		if (!response.ok) throw new Error("Failed to fetch tasks");
		return response.json();
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
		if (!response.ok) throw new Error("Failed to create task");
		return response.json();
	},

	update: async (id: string, updates: Partial<Task>): Promise<Task> => {
		const response = await fetch(`/api/tasks/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		if (!response.ok) throw new Error("Failed to update task");
		return response.json();
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`/api/tasks/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) throw new Error("Failed to delete task");
	},
};
