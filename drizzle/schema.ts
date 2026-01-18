import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const standups = pgTable("standups", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(), // GitHub user ID
	repoFullName: text("repo_full_name").notNull(),
	date: text("date").notNull(), // YYYY-MM-DD format
	yesterday: text("yesterday").notNull(),
	today: text("today").notNull(),
	blockers: text("blockers").notNull(),
	commits: jsonb("commits").notNull(), // Store commit data as JSON
	goalIds: jsonb("goal_ids").notNull().default([]), // Array of goal IDs
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const goals = pgTable("goals", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	targetDate: text("target_date"), // Optional: YYYY-MM-DD
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
