import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/lib/db";
import { standups } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "User ID is required" });
	}

	// GET: Fetch all standups for user
	if (req.method === "GET") {
		try {
			const userStandups = await db
				.select()
				.from(standups)
				.where(eq(standups.userId, userId))
				.orderBy(desc(standups.createdAt));

			return res.status(200).json(userStandups);
		} catch (error) {
			console.error("Failed to fetch standups:", error);
			return res.status(500).json({ error: "Failed to fetch standups" });
		}
	}

	// POST: Create new standup
	if (req.method === "POST") {
		try {
			const {
				repoFullName,
				date,
				yesterday,
				today,
				blockers,
				commits,
				taskIds,
			} = req.body;

			const newStandup = await db
				.insert(standups)
				.values({
					userId,
					repoFullName,
					date,
					yesterday,
					today,
					blockers,
					commits,
					taskIds: taskIds || [],
				})
				.returning();

			return res.status(201).json(newStandup[0]);
		} catch (error) {
			console.error("Failed to create standup:", error);
			return res.status(500).json({ error: "Failed to create standup" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
