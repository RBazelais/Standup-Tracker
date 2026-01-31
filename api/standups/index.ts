import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { standups } from "../../drizzle/schema.ts";
import { eq, desc } from "drizzle-orm";

// Initialize db directly in API route
const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { userId } = req.query;

	console.log("=== Standups API Called ===");
	console.log("Method:", req.method);
	console.log("UserID:", userId);
	console.log("UserID type:", typeof userId);
	console.log("POSTGRES_URL exists:", !!process.env.POSTGRES_URL);

	if (!userId || typeof userId !== "string") {
		console.log("Invalid userId, rejecting request");
		return res.status(400).json({ error: "User ID is required" });
	}

	// GET: Fetch all standups for user
	if (req.method === "GET") {
		try {
			console.log("Attempting to fetch standups from database...");
			const userStandups = await db
				.select()
				.from(standups)
				.where(eq(standups.userId, userId))
				.orderBy(desc(standups.createdAt));

			console.log("Successfully fetched standups:", userStandups.length);
			return res.status(200).json(userStandups);
		} catch (error) {
			console.error("=== ERROR fetching standups ===");
			console.error("Error type:", error?.constructor?.name);
			console.error(
				"Error message:",
				error instanceof Error ? error.message : "Unknown",
			);
			console.error("Full error:", error);
			return res.status(500).json({
				error: "Failed to fetch standups",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// POST: Create new standup
	if (req.method === "POST") {
		try {
			console.log("=== Creating new standup ===");
			console.log("Request body:", req.body);

			const {
				repoFullName,
				date,
				workCompleted,
				workPlanned,
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
					workCompleted,
					workPlanned,
					blockers,
					commits,
					taskIds: taskIds || [],
				})
				.returning();

			console.log("Successfully created standup:", newStandup[0].id);
			return res.status(201).json(newStandup[0]);
		} catch (error) {
			console.error("=== ERROR creating standup ===");
			console.error("Error:", error);
			return res.status(500).json({
				error: "Failed to create standup",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
