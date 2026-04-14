import { pgTable, text, timestamp, uuid, jsonb, integer, unique } from "drizzle-orm/pg-core";

// Standups table - daily standup notes with GitHub commits
export const standups = pgTable("standups", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	repoFullName: text("repo_full_name").notNull(),
	date: text("date").notNull(), // YYYY-MM-DD format
	workCompleted: text("work_completed").notNull(),
	workPlanned: text("work_planned").notNull(),
	blockers: text("blockers").notNull(),
	commits: jsonb("commits").notNull(),
	taskIds: jsonb("task_ids").notNull().default([]),
	snapshotSprintId: uuid("snapshot_sprint_id"),
	snapshotMilestoneId: uuid("snapshot_milestone_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Milestones table - long-term goals
export const milestones = pgTable("milestones", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	targetDate: text("target_date"), // YYYY-MM-DD
	status: text("status").notNull().default("active"), // 'active' | 'completed' | 'archived'
	totalPoints: integer("total_points"),
	completedPoints: integer("completed_points"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sprints table - time-boxed work periods
export const sprints = pgTable("sprints", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
	title: text("title").notNull(),
	description: text("description").notNull(),
	startDate: text("start_date").notNull(), // YYYY-MM-DD
	endDate: text("end_date").notNull(), // YYYY-MM-DD
	status: text("status").notNull().default("planned"), // 'planned' | 'active' | 'completed'
	targetPoints: integer("target_points"),
	completedPoints: integer("completed_points"),
	completedAt: timestamp("completed_at"),
	// External sync — GitHub milestones map to sprints
	externalId: text("external_id"),
	externalSource: text("external_source"), // 'github' | 'jira' | etc.
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks table - individual work items with story points
export const tasks = pgTable("tasks", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	sprintId: uuid("sprint_id").references(() => sprints.id, { onDelete: "set null" }),
	currentSprintId: uuid("current_sprint_id").references(() => sprints.id, { onDelete: "set null" }),
	firstSprintId: uuid("first_sprint_id"),
	title: text("title").notNull(),
	description: text("description").notNull(),
	status: text("status").notNull().default("todo"), // TaskStatus union
	priority: text("priority").notNull().default("none"), // TaskPriority union
	storyPoints: integer("story_points"),
	storyPointSystem: text("story_point_system"), // 'fibonacci' | 'tshirt' | 'linear'
	rolloverCount: integer("rollover_count").notNull().default(0),
	totalSprintsTouched: integer("total_sprints_touched").notNull().default(0),
	// External integration support
	externalId: text("external_id"),
	externalSource: text("external_source"),
	externalUrl: text("external_url"),
	externalData: jsonb("external_data"),
	targetDate: text("target_date"), // YYYY-MM-DD
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Integrations table - stores OAuth tokens for external services
export const integrations = pgTable("integrations", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	source: text("source").notNull(), // 'github' | 'jira' | 'linear' | 'asana'
	accessToken: text("access_token").notNull(),
	accountName: text("account_name"),
	connectedAt: timestamp("connected_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	unique("integrations_user_source_unique").on(table.userId, table.source),
]);

// External task cache - resolved GitHub issues cached for 1 hour
export const externalTaskCache = pgTable("external_task_cache", {
	id: uuid("id").primaryKey().defaultRandom(),
	externalId: text("external_id").notNull(),
	source: text("source").notNull(),
	externalUrl: text("external_url"),
	title: text("title"),
	description: text("description"),
	status: text("status"),
	storyPoints: integer("story_points"),
	priority: text("priority"),
	sprintExternalId: text("sprint_external_id"),
	rawData: jsonb("raw_data"),
	syncedAt: timestamp("synced_at").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	unique("external_task_cache_id_source_unique").on(table.externalId, table.source),
]);

// Task external links - joins internal tasks to external issue references
export const taskExternalLinks = pgTable("task_external_links", {
	id: uuid("id").primaryKey().defaultRandom(),
	taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
	externalId: text("external_id").notNull(),
	source: text("source").notNull(),
	externalUrl: text("external_url"),
	confidence: text("confidence").notNull(), // 'explicit' | 'inferred'
	createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
	unique("task_external_links_id_source_unique").on(table.externalId, table.source),
]);

// Standup tasks - records which tasks were linked to a standup with a status snapshot
export const standupTasks = pgTable("standup_tasks", {
	id: uuid("id").primaryKey().defaultRandom(),
	standupId: uuid("standup_id").notNull().references(() => standups.id, { onDelete: "cascade" }),
	taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
	snapshotSprintId: uuid("snapshot_sprint_id"),
	snapshotStatus: text("snapshot_status"),
	linkedAt: timestamp("linked_at").defaultNow().notNull(),
});
