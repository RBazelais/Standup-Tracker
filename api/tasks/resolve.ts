// api/tasks/resolve.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../lib/db.js";
import { createTaskLinkingService } from "../../shared/task-linking-service.js";

/**
 * POST /api/tasks/resolve
 *
 * Persists a GitHub issue as a Task in the DB and returns the real Task record.
 * Called when a user selects a search result — search results have temp IDs
 * and must be persisted before they can be linked to a standup.
 *
 * Body:
 * - externalId: string (e.g. "#3")
 * - source: "github"
 * - repoFullName: string
 *
 * Returns:
 * - task: Task
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "userId query parameter is required" });
	}

	const { externalId, source, repoFullName } = req.body;

	if (!externalId || typeof externalId !== "string") {
		return res.status(400).json({ error: "externalId is required" });
	}

	if (!source || source !== "github") {
		return res.status(400).json({ error: "source must be 'github'" });
	}

	if (!repoFullName || typeof repoFullName !== "string") {
		return res.status(400).json({ error: "repoFullName is required" });
	}

	try {
		const service = createTaskLinkingService(db);
		const adapterReady = await service.initializeAdapters(userId, repoFullName);

		if (!adapterReady) {
			console.warn(`[tasks/resolve] No GitHub integration found for userId=${userId}`);
			return res.status(401).json({ error: "GitHub integration not connected. Please sign out and sign back in." });
		}

		const task = await service.resolveExternalTask(externalId, source, userId);

		if (!task) {
			return res.status(404).json({ error: `Could not resolve issue ${externalId}` });
		}

		console.log(`[tasks/resolve] Resolved ${externalId} → task ${task.id}`);
		return res.status(200).json({ task });
	} catch (error) {
		console.error("Task resolve error:", error);
		return res.status(500).json({
			error: "Failed to resolve task",
			details: error instanceof Error ? error.message : String(error),
		});
	}
}
