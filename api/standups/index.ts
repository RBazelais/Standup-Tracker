import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { standups, standupTasks, tasks } from "../../drizzle/schema.js";
import { createStandupSchema, validateBody } from "../../drizzle/validation.js";
import { eq, desc, inArray, getTableColumns } from "drizzle-orm";
import { fetchLinkedTasks } from "./_helpers.js";

const db = drizzle(sql);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "User ID is required" });
	}

	// GET: Fetch all standups for user, enriched with linked tasks via junction table
	if (req.method === "GET") {
		try {
			const userStandups = await db
				.select()
				.from(standups)
				.where(eq(standups.userId, userId))
				.orderBy(desc(standups.createdAt));

			type TaskRow = typeof tasks.$inferSelect;
			const linkedTasksMap: Record<string, TaskRow[]> = {};

			if (userStandups.length > 0) {
				const standupIds = userStandups.map(s => s.id);

				const linkedRows = await db
					.select({
						standupId: standupTasks.standupId,
						...getTableColumns(tasks),
					})
					.from(standupTasks)
					.innerJoin(tasks, eq(standupTasks.taskId, tasks.id))
					.where(inArray(standupTasks.standupId, standupIds));

				for (const row of linkedRows) {
					const { standupId, ...task } = row;
					if (!linkedTasksMap[standupId]) linkedTasksMap[standupId] = [];
					linkedTasksMap[standupId].push(task as TaskRow);
				}
			}

			const enriched = userStandups.map(s => ({
				...s,
				linkedTasks: linkedTasksMap[s.id] ?? [],
			}));

			return res.status(200).json(enriched);
		} catch (error) {
			console.error("Failed to fetch standups:", error);
			return res.status(500).json({
				error: "Failed to fetch standups",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// POST: Create new standup and link tasks via junction table
	if (req.method === "POST") {
		const validation = validateBody(createStandupSchema, req.body);
		if (!validation.success) {
			return res.status(400).json({ error: validation.error });
		}

		try {
			const { repoFullName, date, workCompleted, workPlanned, blockers, commits, taskIds } = validation.data;

			const [newStandup] = await db
				.insert(standups)
				.values({
					userId,
					repoFullName,
					date,
					workCompleted,
					workPlanned,
					blockers,
					commits,
				})
				.returning();

			// Link tasks via junction table — verify tasks exist before inserting
			// to avoid foreign key violations from stale or invalid IDs
			const validTaskIds = taskIds.filter(id => UUID_RE.test(id));
			if (validTaskIds.length > 0) {
				const existingTasks = await db
					.select({ id: tasks.id })
					.from(tasks)
					.where(inArray(tasks.id, validTaskIds));

				const existingIds = existingTasks.map(t => t.id);
				if (existingIds.length > 0) {
					await db.insert(standupTasks).values(
						existingIds.map(taskId => ({
							standupId: newStandup.id,
							taskId,
						}))
					);
				}
			}

			const linkedTasks = await fetchLinkedTasks(newStandup.id);

			return res.status(201).json({ ...newStandup, linkedTasks });
		} catch (error) {
			console.error("Failed to create standup:", error);
			return res.status(500).json({
				error: "Failed to create standup",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
