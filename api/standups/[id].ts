import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { standups, standupTasks, tasks } from "../../drizzle/schema.js";
import { updateStandupSchema, validateBody } from "../../drizzle/validation.js";
import { eq, inArray } from "drizzle-orm";
import { fetchLinkedTasks } from "../../shared/standups-helpers.js";

const db = drizzle(sql);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { id } = req.query;

	if (!id || typeof id !== "string") {
		return res.status(400).json({ error: "Standup ID is required" });
	}

	// GET: Fetch single standup enriched with linked tasks
	if (req.method === "GET") {
		try {
			const standupRows = await db
				.select()
				.from(standups)
				.where(eq(standups.id, id))
				.limit(1);

			if (standupRows.length === 0) {
				return res.status(404).json({ error: "Standup not found" });
			}

			const standup = standupRows[0];
			const linkedTasks = await fetchLinkedTasks(id);

			return res.status(200).json({ ...standup, linkedTasks });
		} catch (error) {
			console.error("Failed to fetch standup:", error);
			return res.status(500).json({
				error: "Failed to fetch standup",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// PUT: Update standup fields and replace linked tasks if taskIds provided
	if (req.method === "PUT") {
		const validation = validateBody(updateStandupSchema, req.body);
		if (!validation.success) {
			return res.status(400).json({ error: validation.error });
		}

		try {
			const { taskIds, ...fields } = validation.data;

			const updatedRows = await db
				.update(standups)
				.set({ ...fields, updatedAt: new Date() })
				.where(eq(standups.id, id))
				.returning();

			if (updatedRows.length === 0) {
				return res.status(404).json({ error: "Standup not found" });
			}

			// Replace linked tasks if taskIds was explicitly provided
			if (taskIds !== undefined) {
				await db.delete(standupTasks).where(eq(standupTasks.standupId, id));

				const validTaskIds = taskIds.filter(tid => UUID_RE.test(tid));
				if (validTaskIds.length > 0) {
					const existingTasks = await db
						.select({ id: tasks.id })
						.from(tasks)
						.where(inArray(tasks.id, validTaskIds));

					const existingIds = existingTasks.map(t => t.id);
					if (existingIds.length > 0) {
						await db.insert(standupTasks).values(
							existingIds.map(taskId => ({
								standupId: id,
								taskId,
							}))
						);
					}
				}
			}

			// Return updated standup with current linked tasks
			const linkedTasks = await fetchLinkedTasks(id);

			return res.status(200).json({ ...updatedRows[0], linkedTasks });
		} catch (error) {
			console.error("Failed to update standup:", error);
			return res.status(500).json({
				error: "Failed to update standup",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// DELETE: Delete standup
	if (req.method === "DELETE") {
		try {
			await db.delete(standups).where(eq(standups.id, id));
			return res.status(200).json({ success: true });
		} catch (error) {
			console.error("Failed to delete standup:", error);
			return res.status(500).json({
				error: "Failed to delete standup",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
