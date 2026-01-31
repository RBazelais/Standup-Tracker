import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { tasks } from "../../drizzle/schema.ts";
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
		try {
			const {
				sprintId,
				title,
				description,
				status,
				storyPoints,
				storyPointSystem,
				externalId,
				externalSource,
				externalUrl,
				externalData,
				targetDate,
				completedAt,
			} = req.body;

			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (sprintId !== undefined) updateData.sprintId = sprintId;
			if (title !== undefined) updateData.title = title;
			if (description !== undefined) updateData.description = description;
			if (status !== undefined) updateData.status = status;
			if (storyPoints !== undefined) updateData.storyPoints = storyPoints;
			if (storyPointSystem !== undefined) updateData.storyPointSystem = storyPointSystem;
			if (externalId !== undefined) updateData.externalId = externalId;
			if (externalSource !== undefined) updateData.externalSource = externalSource;
			if (externalUrl !== undefined) updateData.externalUrl = externalUrl;
			if (externalData !== undefined) updateData.externalData = externalData;
			if (targetDate !== undefined) updateData.targetDate = targetDate;
			if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;

			// Auto-set completedAt when status changes to 'done'
			if (status === "done" && !completedAt) {
				updateData.completedAt = new Date();
			}

			const updatedTask = await db
				.update(tasks)
				.set(updateData)
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
