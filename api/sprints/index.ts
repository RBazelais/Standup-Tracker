import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { sprints } from "../../drizzle/schema.ts";
import { eq, desc } from "drizzle-orm";

const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { userId, milestoneId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "User ID is required" });
	}

	// GET: Fetch all sprints for user (optionally filtered by milestone)
	if (req.method === "GET") {
		try {
			const userSprints = await db
				.select()
				.from(sprints)
				.where(eq(sprints.userId, userId))
				.orderBy(desc(sprints.startDate));

			// Filter by milestoneId if provided
			const filteredSprints = milestoneId && typeof milestoneId === "string"
				? userSprints.filter(s => s.milestoneId === milestoneId)
				: userSprints;

			return res.status(200).json(filteredSprints);
		} catch (error) {
			console.error("Failed to fetch sprints:", error);
			return res.status(500).json({
				error: "Failed to fetch sprints",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// POST: Create new sprint
	if (req.method === "POST") {
		try {
			const {
				milestoneId: bodyMilestoneId,
				title,
				description,
				startDate,
				endDate,
				status,
				targetPoints,
			} = req.body;

			if (!title || !description || !startDate || !endDate) {
				return res.status(400).json({
					error: "Title, description, startDate, and endDate are required",
				});
			}

			const newSprint = await db
				.insert(sprints)
				.values({
					userId,
					milestoneId: bodyMilestoneId || null,
					title,
					description,
					startDate,
					endDate,
					status: status || "planned",
					targetPoints: targetPoints || null,
				})
				.returning();

			return res.status(201).json(newSprint[0]);
		} catch (error) {
			console.error("Failed to create sprint:", error);
			return res.status(500).json({
				error: "Failed to create sprint",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
