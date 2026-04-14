// api/tasks/link.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../lib/db.js";
import { createTaskLinkingService } from "../../shared/task-linking-service.js";

/**
 * POST /api/tasks/link
 * 
 * Links tasks to a standup
 * 
 * Body:
 * - standupId: string
 * - taskIds: string[]
 * - snapshotSprintId?: string (optional, will use task's current sprint if not provided)
 * 
 * Returns:
 * - success: boolean
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "userId query parameter is required" });
	}

	const { standupId, taskIds, snapshotSprintId } = req.body;

	if (!standupId || typeof standupId !== "string") {
		return res.status(400).json({ error: "standupId is required" });
	}

	if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
		return res.status(400).json({ error: "taskIds array is required and must not be empty" });
	}

	// Verify standup belongs to user
	const standup = await db.standups.findOne({
		id: standupId,
		userId,
	});

	if (!standup) {
		return res.status(404).json({ error: "Standup not found" });
	}

	try {
		const service = createTaskLinkingService(db);

		await service.linkTasksToStandup(standupId, taskIds, snapshotSprintId);

		// Update standup's snapshot sprint if not already set
		if (!standup.snapshotSprintId && snapshotSprintId) {
			await db.standups.updateSnapshotSprint(standupId, snapshotSprintId);
		}

		return res.status(200).json({ success: true });
	} catch (error) {
		console.error("Task linking error:", error);
		return res.status(500).json({
			error: "Failed to link tasks",
			details: error instanceof Error ? error.message : String(error),
		});
	}
}