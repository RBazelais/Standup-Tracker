import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { milestones } from "../../drizzle/schema.ts";
import { eq, desc } from "drizzle-orm";

const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "User ID is required" });
	}

	// GET: Fetch all milestones for user
	if (req.method === "GET") {
		try {
			const userMilestones = await db
				.select()
				.from(milestones)
				.where(eq(milestones.userId, userId))
				.orderBy(desc(milestones.createdAt));

			return res.status(200).json(userMilestones);
		} catch (error) {
			console.error("Failed to fetch milestones:", error);
			return res.status(500).json({
				error: "Failed to fetch milestones",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// POST: Create new milestone
	if (req.method === "POST") {
		try {
			const { title, description, targetDate, status } = req.body;

			if (!title || !description) {
				return res.status(400).json({ error: "Title and description are required" });
			}

			const newMilestone = await db
				.insert(milestones)
				.values({
					userId,
					title,
					description,
					targetDate: targetDate || null,
					status: status || "active",
				})
				.returning();

			return res.status(201).json(newMilestone[0]);
		} catch (error) {
			console.error("Failed to create milestone:", error);
			return res.status(500).json({
				error: "Failed to create milestone",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
