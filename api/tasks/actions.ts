// api/tasks/actions.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../lib/db.js";
import { createTaskLinkingService } from "../../shared/task-linking-service.js";

/**
 * POST /api/tasks/actions?userId=<id>
 *
 * Routes to one of three task operations based on the `action` field in the request body.
 *
 * action: "detect"
 *   body: { commits, repoFullName }
 *   Returns: { resolved, autoLinked, suggested, errors }
 *
 * action: "search"
 *   body: { query, source, repoFullName, state?, milestone?, limit? }
 *   Returns: { tasks }
 *
 * action: "resolve"
 *   body: { externalId, source, repoFullName }
 *   Returns: { task }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { userId } = req.query;
	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "userId query parameter is required" });
	}

	const { action } = req.body;

	if (action === "detect") {
		return handleDetect(req, res, userId);
	}
	if (action === "search") {
		return handleSearch(req, res, userId);
	}
	if (action === "resolve") {
		return handleResolve(req, res, userId);
	}

	return res.status(400).json({ error: "action must be 'detect', 'search', or 'resolve'" });
}

async function handleDetect(req: VercelRequest, res: VercelResponse, userId: string) {
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
		const result = await service.detectAndResolveTasks({ commits, repoFullName }, userId);
		return res.status(200).json(result);
	} catch (error) {
		console.error("Task detection error:", error);
		return res.status(500).json({
			error: "Failed to detect tasks",
			details: error instanceof Error ? error.message : String(error),
		});
	}
}

async function handleSearch(req: VercelRequest, res: VercelResponse, userId: string) {
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
		const adapterReady = await service.initializeAdapters(userId, repoFullName);

		if (!adapterReady) {
			console.warn(`[tasks/actions/search] No GitHub integration found for userId=${userId}`);
			return res.status(401).json({ error: "GitHub integration not connected. Please sign out and sign back in." });
		}

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

async function handleResolve(req: VercelRequest, res: VercelResponse, userId: string) {
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
			console.warn(`[tasks/actions/resolve] No GitHub integration found for userId=${userId}`);
			return res.status(401).json({ error: "GitHub integration not connected. Please sign out and sign back in." });
		}

		const task = await service.resolveExternalTask(externalId, source, userId);

		if (!task) {
			return res.status(404).json({ error: `Could not resolve issue ${externalId}` });
		}

		return res.status(200).json({ task });
	} catch (error) {
		console.error("Task resolve error:", error);
		return res.status(500).json({
			error: "Failed to resolve task",
			details: error instanceof Error ? error.message : String(error),
		});
	}
}
