// api/tasks/search.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../lib/db.js";
import { createTaskLinkingService } from "../../src/services/task-linking-service";

/**
 * POST /api/tasks/search
 * 
 * Searches for tasks in external systems (GitHub Issues)
 * 
 * Body:
 * - query: string (search term)
 * - source: "github" (expandable to "jira" | "linear" | "asana")
 * - repoFullName: string
 * - state?: "open" | "closed" | "all" (default: "open")
 * - milestone?: string (milestone number)
 * - limit?: number (default: 20)
 * 
 * Returns:
 * - tasks: Array of matching tasks
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "userId query parameter is required" });
	}

	const { query, source, repoFullName, state, milestone, limit } = req.body;

	if (!query || typeof query !== "string") {
		return res.status(400).json({ error: "query is required" });
	}

	if (!source || source !== "github") {
		return res.status(400).json({ error: "source must be 'github'" });
	}

	if (!repoFullName || typeof repoFullName !== "string") {
		return res.status(400).json({ error: "repoFullName is required" });
	}

	try {
		const service = createTaskLinkingService(db);
		await service.initializeAdapters(userId, repoFullName);

		const tasks = await service.searchTasks(query, source, {
			state: state || "open",
			milestone,
			limit: limit || 20,
		});

		return res.status(200).json({ tasks });
	} catch (error) {
		console.error("Task search error:", error);
		return res.status(500).json({
			error: "Failed to search tasks",
			details: error instanceof Error ? error.message : String(error),
		});
	}
}