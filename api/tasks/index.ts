import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { tasks } from "../../drizzle/schema.ts";
import { createTaskSchema, validateBody } from "../../drizzle/validation.ts";
import { eq, desc } from "drizzle-orm";

const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { userId, sprintId, status } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "User ID is required" });
	}

	// GET: Fetch all tasks for user (optionally filtered by sprint or status)
	if (req.method === "GET") {
		try {
			const userTasks = await db
				.select()
				.from(tasks)
				.where(eq(tasks.userId, userId))
				.orderBy(desc(tasks.createdAt));

			// Apply filters
			let filteredTasks = userTasks;

			if (sprintId && typeof sprintId === "string") {
				filteredTasks = filteredTasks.filter(t => t.sprintId === sprintId);
			}

			if (status && typeof status === "string") {
				filteredTasks = filteredTasks.filter(t => t.status === status);
			}

			return res.status(200).json(filteredTasks);
		} catch (error) {
			console.error("Failed to fetch tasks:", error);
			return res.status(500).json({
				error: "Failed to fetch tasks",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// POST: Create new task
	if (req.method === "POST") {
		// Validate request body
		const validation = validateBody(createTaskSchema, req.body);
		if (!validation.success) {
			return res.status(400).json({ error: validation.error });
		}

		try {
			const newTask = await db
				.insert(tasks)
				.values({
					userId,
					...validation.data,
					status: validation.data.status || "todo",
				})
				.returning();

			return res.status(201).json(newTask[0]);
		} catch (error) {
			console.error("Failed to create task:", error);
			return res.status(500).json({
				error: "Failed to create task",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
