import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { standups } from "../../drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { id } = req.query;

	if (!id || typeof id !== "string") {
		return res.status(400).json({ error: "Standup ID is required" });
	}

	// GET: Fetch single standup
	if (req.method === "GET") {
		try {
			const standup = await db
				.select()
				.from(standups)
				.where(eq(standups.id, id))
				.limit(1);

			if (standup.length === 0) {
				return res.status(404).json({ error: "Standup not found" });
			}

			return res.status(200).json(standup[0]);
		} catch (error) {
			console.error("Failed to fetch standup:", error);
			return res.status(500).json({ error: "Failed to fetch standup" });
		}
	}

	// PUT: Update standup
	if (req.method === "PUT") {
		try {
			const { workCompleted, workPlanned, blockers, taskIds } = req.body;

			const updatedStandup = await db
				.update(standups)
				.set({
					workCompleted,
					workPlanned,
					blockers,
					taskIds: taskIds || [],
					updatedAt: new Date(),
				})
				.where(eq(standups.id, id))
				.returning();

			if (updatedStandup.length === 0) {
				return res.status(404).json({ error: "Standup not found" });
			}

			return res.status(200).json(updatedStandup[0]);
		} catch (error) {
			console.error("Failed to update standup:", error);
			return res.status(500).json({ error: "Failed to update standup" });
		}
	}

	// DELETE: Delete standup
	if (req.method === "DELETE") {
		try {
			await db.delete(standups).where(eq(standups.id, id));
			return res.status(200).json({ success: true });
		} catch (error) {
			console.error("Failed to delete standup:", error);
			return res.status(500).json({ error: "Failed to delete standup" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
