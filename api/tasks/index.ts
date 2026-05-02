import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { tasks } from "../../drizzle/schema.js";
import { createTaskSchema, validateBody } from "../../drizzle/validation.js";
import { eq, desc } from "drizzle-orm";
import { db as integrationDb } from "../../shared/db.js";
import { createTaskLinkingService } from "../../shared/task-linking-service.js";

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

	// POST: action-based routing (detect/search/resolve) or create new task
	if (req.method === "POST") {
		const { action } = req.body ?? {};

		if (action === "detect") return handleDetect(req, res, userId);
		if (action === "search") return handleSearch(req, res, userId);
		if (action === "resolve") return handleResolve(req, res, userId);

		// No action field — create task
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

async function handleDetect(req: VercelRequest, res: VercelResponse, userId: string) {
	const { commits, repoFullName } = req.body;

	if (!commits || !Array.isArray(commits)) {
		return res.status(400).json({ error: "commits array is required" });
	}
	if (!repoFullName || typeof repoFullName !== "string") {
		return res.status(400).json({ error: "repoFullName is required" });
	}

	try {
		const service = createTaskLinkingService(integrationDb);
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
	if (!source || (source !== "github" && source !== "jira")) {
		return res.status(400).json({ error: "source must be 'github' or 'jira'" });
	}
	if (source === "github" && (!repoFullName || typeof repoFullName !== "string")) {
		return res.status(400).json({ error: "repoFullName is required for GitHub source" });
	}

	try {
		const service = createTaskLinkingService(integrationDb);
		await service.initializeAdapters(userId, repoFullName || "");

		if (!service.isAdapterReady(source)) {
			const msg = source === "jira"
				? "Jira integration not connected. Go to Settings to connect."
				: "GitHub integration not connected. Please sign out and sign back in.";
			console.warn(`[tasks/search] ${source} adapter not ready for userId=${userId}`);
			return res.status(401).json({ error: msg });
		}

		const result = await service.searchTasks(query, source, {
			state: state || "open",
			milestone,
			limit: limit || 20,
		});

		return res.status(200).json({ tasks: result });
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
	if (!source || (source !== "github" && source !== "jira")) {
		return res.status(400).json({ error: "source must be 'github' or 'jira'" });
	}
	if (source === "github" && (!repoFullName || typeof repoFullName !== "string")) {
		return res.status(400).json({ error: "repoFullName is required for GitHub source" });
	}

	try {
		const service = createTaskLinkingService(integrationDb);
		await service.initializeAdapters(userId, repoFullName || "");

		if (!service.isAdapterReady(source)) {
			const msg = source === "jira"
				? "Jira integration not connected. Go to Settings to connect."
				: "GitHub integration not connected. Please sign out and sign back in.";
			console.warn(`[tasks/resolve] ${source} adapter not ready for userId=${userId}`);
			return res.status(401).json({ error: msg });
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
