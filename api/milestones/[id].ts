import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { milestones } from "../../drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { id } = req.query;

	if (!id || typeof id !== "string") {
		return res.status(400).json({ error: "Milestone ID is required" });
	}

	// GET: Fetch single milestone
	if (req.method === "GET") {
		try {
			const milestone = await db
				.select()
				.from(milestones)
				.where(eq(milestones.id, id))
				.limit(1);

			if (milestone.length === 0) {
				return res.status(404).json({ error: "Milestone not found" });
			}

			return res.status(200).json(milestone[0]);
		} catch (error) {
			console.error("Failed to fetch milestone:", error);
			return res.status(500).json({ error: "Failed to fetch milestone" });
		}
	}

	// PUT: Update milestone
	if (req.method === "PUT") {
		try {
			const { title, description, targetDate, status, totalPoints, completedPoints, completedAt } = req.body;

			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (title !== undefined) updateData.title = title;
			if (description !== undefined) updateData.description = description;
			if (targetDate !== undefined) updateData.targetDate = targetDate;
			if (status !== undefined) updateData.status = status;
			if (totalPoints !== undefined) updateData.totalPoints = totalPoints;
			if (completedPoints !== undefined) updateData.completedPoints = completedPoints;
			if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;

			const updatedMilestone = await db
				.update(milestones)
				.set(updateData)
				.where(eq(milestones.id, id))
				.returning();

			if (updatedMilestone.length === 0) {
				return res.status(404).json({ error: "Milestone not found" });
			}

			return res.status(200).json(updatedMilestone[0]);
		} catch (error) {
			console.error("Failed to update milestone:", error);
			return res.status(500).json({ error: "Failed to update milestone" });
		}
	}

	// DELETE: Delete milestone
	if (req.method === "DELETE") {
		try {
			await db.delete(milestones).where(eq(milestones.id, id));
			return res.status(200).json({ success: true });
		} catch (error) {
			console.error("Failed to delete milestone:", error);
			return res.status(500).json({ error: "Failed to delete milestone" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
