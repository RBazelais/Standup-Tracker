import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { tasks } from "../../drizzle/schema.ts";
import { updateTaskSchema, validateBody } from "../../drizzle/validation.ts";
import { eq } from "drizzle-orm";

const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { id } = req.query;

	if (!id || typeof id !== "string") {
		return res.status(400).json({ error: "Task ID is required" });
	}

	// GET: Fetch single task
	if (req.method === "GET") {
		try {
			const task = await db
				.select()
				.from(tasks)
				.where(eq(tasks.id, id))
				.limit(1);

			if (task.length === 0) {
				return res.status(404).json({ error: "Task not found" });
			}

			return res.status(200).json(task[0]);
		} catch (error) {
			console.error("Failed to fetch task:", error);
			return res.status(500).json({ error: "Failed to fetch task" });
		}
	}

	// PUT: Update task
	if (req.method === "PUT") {
		// Validate request body
		const validation = validateBody(updateTaskSchema, req.body);
		if (!validation.success) {
			return res.status(400).json({ error: validation.error });
		}

		try {
			// Build updates, converting completedAt string to Date if present
			const { completedAt, ...rest } = validation.data;
			const updates: Record<string, unknown> = {
				...rest,
				updatedAt: new Date(),
			};

			if (completedAt !== undefined) {
				updates.completedAt = completedAt ? new Date(completedAt) : null;
			}

			// Auto-set completedAt when status changes to 'done'
			if (rest.status === "done" && !completedAt) {
				updates.completedAt = new Date();
			}

			const updatedTask = await db
				.update(tasks)
				.set(updates)
				.where(eq(tasks.id, id))
				.returning();

			if (updatedTask.length === 0) {
				return res.status(404).json({ error: "Task not found" });
			}

			return res.status(200).json(updatedTask[0]);
		} catch (error) {
			console.error("Failed to update task:", error);
			return res.status(500).json({ error: "Failed to update task" });
		}
	}

	// DELETE: Delete task
	if (req.method === "DELETE") {
		try {
			await db.delete(tasks).where(eq(tasks.id, id));
			return res.status(200).json({ success: true });
		} catch (error) {
			console.error("Failed to delete task:", error);
			return res.status(500).json({ error: "Failed to delete task" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
