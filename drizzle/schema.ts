import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";

// Standups table - daily standup notes with GitHub commits
export const standups = pgTable("standups", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(), // GitHub user ID
	repoFullName: text("repo_full_name").notNull(),
	date: text("date").notNull(), // YYYY-MM-DD format
	workCompleted: text("work_completed").notNull(), // Renamed from 'yesterday'
	workPlanned: text("work_planned").notNull(), // Renamed from 'today'
	blockers: text("blockers").notNull(),
	commits: jsonb("commits").notNull(), // Store commit data as JSON
	taskIds: jsonb("task_ids").notNull().default([]), // Array of task IDs
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Milestones table - long-term goals (renamed from 'goals')
export const milestones = pgTable("milestones", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(), // e.g., "Ship MVP to Production"
	description: text("description").notNull(),
	targetDate: text("target_date"), // Optional: YYYY-MM-DD
	status: text("status").notNull().default("active"), // 'active' | 'completed' | 'archived'
	totalPoints: integer("total_points"), // Computed from child sprints
	completedPoints: integer("completed_points"), // Computed from child sprints
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sprints table - time-boxed work periods
export const sprints = pgTable("sprints", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
	title: text("title").notNull(), // e.g., "Sprint 1: Auth & Database"
	description: text("description").notNull(),
	startDate: text("start_date").notNull(), // YYYY-MM-DD
	endDate: text("end_date").notNull(), // YYYY-MM-DD
	status: text("status").notNull().default("planned"), // 'planned' | 'active' | 'completed'
	targetPoints: integer("target_points"), // Planned points for sprint
	completedPoints: integer("completed_points"), // Actual completed points
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks table - individual work items with story points
export const tasks = pgTable("tasks", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	sprintId: uuid("sprint_id").references(() => sprints.id, { onDelete: "set null" }),
	title: text("title").notNull(), // e.g., "Implement GitHub OAuth"
	description: text("description").notNull(),
	status: text("status").notNull().default("todo"), // 'todo' | 'in_progress' | 'done'
	storyPoints: integer("story_points"), // e.g., 1, 2, 3, 5, 8, 13
	storyPointSystem: text("story_point_system"), // 'fibonacci' | 'tshirt' | 'linear'
	// External integration support (future: Jira/Asana/Linear)
	externalId: text("external_id"), // Jira key, Asana GID, Linear ID
	externalSource: text("external_source"), // 'jira' | 'asana' | 'linear'
	externalUrl: text("external_url"), // Deep link to external task
	externalData: jsonb("external_data"), // Full API response for reference
	targetDate: text("target_date"), // Optional deadline
	completedAt: timestamp("completed_at"), // When marked done
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
