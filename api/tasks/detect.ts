// api/tasks/detect.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../lib/db.js";
import { createTaskLinkingService } from "../../src/services/task-linking-service";

/**
 * POST /api/tasks/detect
 * 
 * Detects task references from commit messages and resolves them
 * 
 * Body:
 * - commits: Array<{ commit: { message: string } }>
 * - repoFullName: string (e.g., "owner/repo")
 * 
 * Returns:
 * - detected: All found references
 * - resolved: Successfully resolved tasks
 * - suggested: Tasks for user to confirm (inferred refs)
 * - autoLinked: Tasks to auto-link (explicit refs like "Fixes #42")
 * - errors: Any resolution failures
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "userId query parameter is required" });
	}

	const { commits, repoFullName } = req.body;

	if (!commits || !Array.isArray(commits)) {
		return res.status(400).json({ error: "commits array is required" });
	}

	if (!repoFullName || typeof repoFullName !== "string") {
		return res.status(400).json({ error: "repoFullName is required" });
	}

	try {
		const service = createTaskLinkingService(db);
		await service.initializeAdapters(userId, repoFullName);

		const result = await service.detectAndResolveTasks(
			{ commits, repoFullName },
			userId
		);

		return res.status(200).json(result);
	} catch (error) {
		console.error("Task detection error:", error);
		return res.status(500).json({
			error: "Failed to detect tasks",
			details: error instanceof Error ? error.message : String(error),
		});
	}
}