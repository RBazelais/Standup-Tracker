import { describe, it, expect } from "vitest";
import {
	createStandupSchema,
	updateStandupSchema,
	createMilestoneSchema,
	updateMilestoneSchema,
	createSprintSchema,
	updateSprintSchema,
	createTaskSchema,
	updateTaskSchema,
	validateBody,
} from "./validation";

describe("validation", () => {
	describe("validateBody helper", () => {
		it("returns success with parsed data for valid input", () => {
			const result = validateBody(createMilestoneSchema, {
				title: "Q1 Goals",
				description: "First quarter objectives",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.title).toBe("Q1 Goals");
				expect(result.data.status).toBe("active"); // default value
			}
		});

		it("returns error with field name for invalid input", () => {
			const result = validateBody(createMilestoneSchema, {
				title: "", // too short
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("title");
			}
		});

		it("returns error message without field for root-level errors", () => {
			const result = validateBody(createMilestoneSchema, null);
			expect(result.success).toBe(false);
		});
	});

	describe("createStandupSchema", () => {
		const validStandup = {
			repoFullName: "user/repo",
			date: "2026-02-07",
			workCompleted: "Finished the login feature",
			workPlanned: "Start on dashboard",
		};

		it("validates a complete standup", () => {
			const result = createStandupSchema.safeParse(validStandup);
			expect(result.success).toBe(true);
		});

		it("applies default values for optional fields", () => {
			const result = createStandupSchema.safeParse(validStandup);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.blockers).toBe("None");
				expect(result.data.commits).toEqual([]);
				expect(result.data.taskIds).toEqual([]);
			}
		});

		it("rejects missing required fields", () => {
			const result = createStandupSchema.safeParse({
				repoFullName: "user/repo",
				date: "2026-02-07",
				// missing workCompleted and workPlanned
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid date format", () => {
			const result = createStandupSchema.safeParse({
				...validStandup,
				date: "02-07-2026", // wrong format
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain("YYYY-MM-DD");
			}
		});

		it("rejects empty repository name", () => {
			const result = createStandupSchema.safeParse({
				...validStandup,
				repoFullName: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("updateStandupSchema", () => {
		it("allows partial updates", () => {
			const result = updateStandupSchema.safeParse({
				workCompleted: "Updated work",
			});
			expect(result.success).toBe(true);
		});

		it("allows empty object for no changes", () => {
			const result = updateStandupSchema.safeParse({});
			expect(result.success).toBe(true);
		});
	});

	describe("createMilestoneSchema", () => {
		it("validates with required fields only", () => {
			const result = createMilestoneSchema.safeParse({
				title: "Launch MVP",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBe("");
				expect(result.data.status).toBe("active");
			}
		});

		it("validates with all fields", () => {
			const result = createMilestoneSchema.safeParse({
				title: "Launch MVP",
				description: "Ship the minimum viable product",
				targetDate: "2026-03-15",
				status: "completed",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid status", () => {
			const result = createMilestoneSchema.safeParse({
				title: "Test",
				status: "invalid_status",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid targetDate format", () => {
			const result = createMilestoneSchema.safeParse({
				title: "Test",
				targetDate: "March 15, 2026",
			});
			expect(result.success).toBe(false);
		});

		it("allows null targetDate", () => {
			const result = createMilestoneSchema.safeParse({
				title: "Test",
				targetDate: null,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("createSprintSchema", () => {
		const validSprint = {
			title: "Sprint 1",
			description: "First sprint",
			startDate: "2026-02-01",
			endDate: "2026-02-14",
		};

		it("validates a complete sprint", () => {
			const result = createSprintSchema.safeParse(validSprint);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.status).toBe("planned");
			}
		});

		it("rejects missing startDate", () => {
			const result = createSprintSchema.safeParse({
				title: "Sprint 1",
				description: "Test",
				endDate: "2026-02-14",
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing endDate", () => {
			const result = createSprintSchema.safeParse({
				title: "Sprint 1",
				description: "Test",
				startDate: "2026-02-01",
			});
			expect(result.success).toBe(false);
		});

		it("validates optional milestoneId as UUID", () => {
			const result = createSprintSchema.safeParse({
				...validSprint,
				milestoneId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid milestoneId format", () => {
			const result = createSprintSchema.safeParse({
				...validSprint,
				milestoneId: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("validates targetPoints as positive integer", () => {
			const result = createSprintSchema.safeParse({
				...validSprint,
				targetPoints: 21,
			});
			expect(result.success).toBe(true);
		});

		it("rejects negative targetPoints", () => {
			const result = createSprintSchema.safeParse({
				...validSprint,
				targetPoints: -5,
			});
			expect(result.success).toBe(false);
		});

		it("accepts valid status values", () => {
			for (const status of ["planned", "active", "completed"]) {
				const result = createSprintSchema.safeParse({
					...validSprint,
					status,
				});
				expect(result.success).toBe(true);
			}
		});
	});

	describe("createTaskSchema", () => {
		const validTask = {
			title: "Implement login",
			description: "Add OAuth login flow",
		};

		it("validates with required fields only", () => {
			const result = createTaskSchema.safeParse(validTask);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.status).toBe("todo");
			}
		});

		it("validates all status values", () => {
			for (const status of ["todo", "in_progress", "done"]) {
				const result = createTaskSchema.safeParse({
					...validTask,
					status,
				});
				expect(result.success).toBe(true);
			}
		});

		it("validates storyPointSystem enum", () => {
			for (const system of ["fibonacci", "tshirt", "linear"]) {
				const result = createTaskSchema.safeParse({
					...validTask,
					storyPointSystem: system,
				});
				expect(result.success).toBe(true);
			}
		});

		it("rejects invalid storyPointSystem", () => {
			const result = createTaskSchema.safeParse({
				...validTask,
				storyPointSystem: "custom",
			});
			expect(result.success).toBe(false);
		});

		it("validates externalUrl as proper URL", () => {
			const result = createTaskSchema.safeParse({
				...validTask,
				externalUrl: "https://github.com/user/repo/issues/1",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid externalUrl", () => {
			const result = createTaskSchema.safeParse({
				...validTask,
				externalUrl: "not-a-url",
			});
			expect(result.success).toBe(false);
		});

		it("allows null externalUrl", () => {
			const result = createTaskSchema.safeParse({
				...validTask,
				externalUrl: null,
			});
			expect(result.success).toBe(true);
		});

		it("validates storyPoints as positive integer", () => {
			const result = createTaskSchema.safeParse({
				...validTask,
				storyPoints: 5,
			});
			expect(result.success).toBe(true);
		});

		it("rejects zero storyPoints", () => {
			const result = createTaskSchema.safeParse({
				...validTask,
				storyPoints: 0,
			});
			expect(result.success).toBe(false);
		});

		it("rejects decimal storyPoints", () => {
			const result = createTaskSchema.safeParse({
				...validTask,
				storyPoints: 2.5,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("updateTaskSchema", () => {
		it("allows partial updates", () => {
			const result = updateTaskSchema.safeParse({
				status: "done",
			});
			expect(result.success).toBe(true);
		});

		it("validates completedAt as ISO datetime", () => {
			const result = updateTaskSchema.safeParse({
				completedAt: "2026-02-07T15:30:00Z",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid completedAt format", () => {
			const result = updateTaskSchema.safeParse({
				completedAt: "2026-02-07", // not a datetime
			});
			expect(result.success).toBe(false);
		});

		it("allows null completedAt", () => {
			const result = updateTaskSchema.safeParse({
				completedAt: null,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("updateSprintSchema", () => {
		it("allows updating just status", () => {
			const result = updateSprintSchema.safeParse({
				status: "active",
			});
			expect(result.success).toBe(true);
		});

		it("allows updating multiple fields", () => {
			const result = updateSprintSchema.safeParse({
				title: "Updated Sprint",
				targetPoints: 34,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("updateMilestoneSchema", () => {
		it("allows partial milestone updates", () => {
			const result = updateMilestoneSchema.safeParse({
				status: "completed",
			});
			expect(result.success).toBe(true);
		});
	});
});
