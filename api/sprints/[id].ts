import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { sprints } from "../../drizzle/schema.ts";
import { updateSprintSchema, validateBody } from "../../drizzle/validation.ts";
import { eq } from "drizzle-orm";

const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { id } = req.query;

	if (!id || typeof id !== "string") {
		return res.status(400).json({ error: "Sprint ID is required" });
	}

	// GET: Fetch single sprint
	if (req.method === "GET") {
		try {
			const sprint = await db
				.select()
				.from(sprints)
				.where(eq(sprints.id, id))
				.limit(1);

			if (sprint.length === 0) {
				return res.status(404).json({ error: "Sprint not found" });
			}

			return res.status(200).json(sprint[0]);
		} catch (error) {
			console.error("Failed to fetch sprint:", error);
			return res.status(500).json({ error: "Failed to fetch sprint" });
		}
	}

	// PUT: Update sprint
	if (req.method === "PUT") {
		// Validate request body
		const validation = validateBody(updateSprintSchema, req.body);
		if (!validation.success) {
			return res.status(400).json({ error: validation.error });
		}

		try {
			const updates = {
				...validation.data,
				updatedAt: new Date(),
			};

			const updatedSprint = await db
				.update(sprints)
				.set(updates)
				.where(eq(sprints.id, id))
				.returning();

			if (updatedSprint.length === 0) {
				return res.status(404).json({ error: "Sprint not found" });
			}

			return res.status(200).json(updatedSprint[0]);
		} catch (error) {
			console.error("Failed to update sprint:", error);
			return res.status(500).json({ error: "Failed to update sprint" });
		}
	}

	// DELETE: Delete sprint
	if (req.method === "DELETE") {
		try {
			await db.delete(sprints).where(eq(sprints.id, id));
			return res.status(200).json({ success: true });
		} catch (error) {
			console.error("Failed to delete sprint:", error);
			return res.status(500).json({ error: "Failed to delete sprint" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
