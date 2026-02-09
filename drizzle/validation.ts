import { z } from "zod";

// ==================== STANDUPS ====================
export const createStandupSchema = z.object({
	repoFullName: z.string().min(1, "Repository is required"),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
	workCompleted: z.string().min(1, "Work completed is required"),
	workPlanned: z.string().min(1, "Work planned is required"),
	blockers: z.string().default("None"),
	commits: z.array(z.any()).default([]),
	taskIds: z.array(z.string()).default([]),
});

export const updateStandupSchema = createStandupSchema.partial();

// ==================== MILESTONES ====================
export const createMilestoneSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().default(""),
	targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").nullable().optional(),
	status: z.enum(["active", "completed", "archived"]).default("active"),
});

export const updateMilestoneSchema = createMilestoneSchema.partial();

// ==================== SPRINTS ====================
export const createSprintSchema = z.object({
	milestoneId: z.string().uuid().nullable().optional(),
	title: z.string().min(1, "Title is required"),
	description: z.string().default(""),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD format"),
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD format"),
	status: z.enum(["planned", "active", "completed"]).default("planned"),
	targetPoints: z.number().int().positive().nullable().optional(),
});

export const updateSprintSchema = createSprintSchema.partial();

// ==================== TASKS ====================
export const createTaskSchema = z.object({
	sprintId: z.string().uuid().nullable().optional(),
	title: z.string().min(1, "Title is required"),
	description: z.string().default(""),
	status: z.enum(["todo", "in_progress", "done"]).default("todo"),
	storyPoints: z.number().int().positive().nullable().optional(),
	storyPointSystem: z.enum(["fibonacci", "tshirt", "linear"]).nullable().optional(),
	externalId: z.string().nullable().optional(),
	externalSource: z.string().nullable().optional(),
	externalUrl: z.string().url().nullable().optional(),
	externalData: z.any().nullable().optional(),
	targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").nullable().optional(),
});

export const updateTaskSchema = z.object({
	sprintId: z.string().uuid().nullable().optional(),
	title: z.string().min(1, "Title is required").optional(),
	description: z.string().optional(),
	status: z.enum(["todo", "in_progress", "done"]).optional(),
	storyPoints: z.number().int().positive().nullable().optional(),
	storyPointSystem: z.enum(["fibonacci", "tshirt", "linear"]).nullable().optional(),
	externalId: z.string().nullable().optional(),
	externalSource: z.string().nullable().optional(),
	externalUrl: z.string().url().nullable().optional(),
	externalData: z.any().nullable().optional(),
	targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").nullable().optional(),
	completedAt: z.string().datetime().nullable().optional(),
});

// ==================== VALIDATION HELPER ====================
export function validateBody<T>(
	schema: z.ZodSchema<T>,
	body: unknown
): { success: true; data: T } | { success: false; error: string } {
	const result = schema.safeParse(body);
	if (result.success) {
		return { success: true, data: result.data };
	}
	// Return first error message
	const firstError = result.error.issues[0];
	const field = firstError.path.join(".");
	const message = field ? `${field}: ${firstError.message}` : firstError.message;
	return { success: false, error: message };
}
