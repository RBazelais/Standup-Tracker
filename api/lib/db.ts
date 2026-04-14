import { neon } from '@neondatabase/serverless';
import type { ExternalTaskCache, Task, ExternalSource } from '../../src/types';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Shared database client for Vercel serverless functions
 * Wraps Neon SQL queries with typed methods
 */
export const db = {
	// INTEGRATIONS
	integrations: {
		async findOne(query: { userId: string; source: 'github' }) {
			const rows = await sql`
				SELECT access_token as "accessToken"
				FROM integrations
				WHERE user_id = ${query.userId} AND source = ${query.source}
				LIMIT 1
			`;
			return (rows[0] as { accessToken: string } | undefined) || null;
		},
	},

	// EXTERNAL TASK CACHE
	externalTaskCache: {
		async findOne(query: { externalId: string; source: ExternalSource }) {
			const rows = await sql`
				SELECT 
					external_id as "externalId",
					source,
					external_url as "externalUrl",
					title,
					description,
					status,
					story_points as "storyPoints",
					priority,
					sprint_external_id as "sprintExternalId",
					raw_data as "rawData",
					synced_at as "syncedAt"
				FROM external_task_cache
				WHERE external_id = ${query.externalId} AND source = ${query.source}
				LIMIT 1
			`;
			return (rows[0] as ExternalTaskCache | undefined) || null;
		},

		async upsert(payload: Partial<ExternalTaskCache> & { externalId: string; source: ExternalSource }) {
			const now = new Date();
			await sql`
				INSERT INTO external_task_cache (
					external_id, source, external_url, title, description,
					status, story_points, priority, sprint_external_id, raw_data,
					synced_at, created_at, updated_at
				) VALUES (
					${payload.externalId}, ${payload.source}, ${payload.externalUrl || null},
					${payload.title || null}, ${payload.description || null},
					${payload.status || null}, ${payload.storyPoints || null},
					${payload.priority || null}, ${payload.sprintExternalId || null},
					${payload.rawData ? JSON.stringify(payload.rawData) : null},
					${now}, ${now}, ${now}
				)
				ON CONFLICT (external_id, source) DO UPDATE SET
					external_url = EXCLUDED.external_url,
					title = EXCLUDED.title,
					description = EXCLUDED.description,
					status = EXCLUDED.status,
					story_points = EXCLUDED.story_points,
					priority = EXCLUDED.priority,
					sprint_external_id = EXCLUDED.sprint_external_id,
					raw_data = EXCLUDED.raw_data,
					synced_at = EXCLUDED.synced_at,
					updated_at = EXCLUDED.updated_at
			`;
		},
	},

	// TASKS
	tasks: {
		async findOne(query: { id: string }) {
			const rows = await sql`
				SELECT 
					id,
					user_id as "userId",
					title,
					description,
					status,
					story_points as "storyPoints",
					priority,
					current_sprint_id as "currentSprintId",
					current_milestone_id as "currentMilestoneId",
					first_sprint_id as "firstSprintId",
					rollover_count as "rolloverCount",
					total_sprints_touched as "totalSprintsTouched",
					created_at as "createdAt",
					updated_at as "updatedAt"
				FROM tasks 
				WHERE id = ${query.id} 
				LIMIT 1
			`;
			return (rows[0] as Task | undefined) || null;
		},

		async findByExternalLink(query: { externalId: string; source: ExternalSource }) {
			const rows = await sql`
				SELECT t.*
				FROM tasks t
				JOIN task_external_links tel ON t.id = tel.task_id
				WHERE tel.external_id = ${query.externalId} AND tel.source = ${query.source}
				LIMIT 1
			`;
			return (rows[0] as Task | undefined) || null;
		},

		async create(payload: Omit<Partial<Task>, 'id'> & { userId: string; createdAt: Date; updatedAt: Date }): Promise<Task> {
			const rows = await sql`
				INSERT INTO tasks (
					user_id, title, description, status, story_points, priority,
					first_sprint_id, rollover_count, total_sprints_touched,
					created_at, updated_at
				) VALUES (
					${payload.userId}, ${payload.title || null}, ${payload.description || null},
					${payload.status || 'planned'}, ${payload.storyPoints || null},
					${payload.priority || 'none'}, ${payload.firstSprintId},
					${payload.rolloverCount}, ${payload.totalSprintsTouched},
					${payload.createdAt}, ${payload.updatedAt}
				)
				RETURNING 
					id,
					user_id as "userId",
					title,
					description,
					status,
					story_points as "storyPoints",
					priority,
					current_sprint_id as "currentSprintId",
					first_sprint_id as "firstSprintId",
					rollover_count as "rolloverCount",
					total_sprints_touched as "totalSprintsTouched",
					created_at as "createdAt",
					updated_at as "updatedAt"
			`;
			return rows[0] as Task;
		},

		async update(taskId: string, payload: Partial<Task>) {
			const now = payload.updatedAt || new Date();
			await sql`
				UPDATE tasks
				SET 
					updated_at = ${now},
					title = COALESCE(${payload.title || null}, title),
					description = COALESCE(${payload.description || null}, description),
					status = COALESCE(${payload.status || null}, status),
					story_points = COALESCE(${payload.storyPoints || null}, story_points),
					priority = COALESCE(${payload.priority || null}, priority),
					current_sprint_id = COALESCE(${payload.currentSprintId || null}, current_sprint_id)
				WHERE id = ${taskId}
			`;
		},
	},

	// TASK EXTERNAL LINKS
	taskExternalLinks: {
		async findOne(query: { externalId: string; source: ExternalSource }) {
			const rows = await sql`
				SELECT task_id as "taskId"
				FROM task_external_links
				WHERE external_id = ${query.externalId} AND source = ${query.source}
				LIMIT 1
			`;
			return (rows[0] as { taskId: string } | undefined) || null;
		},

		async create(payload: {
			taskId: string;
			externalId: string;
			source: ExternalSource;
			externalUrl?: string;
			confidence: 'explicit' | 'inferred';
		}) {
			const now = new Date();
			await sql`
				INSERT INTO task_external_links (
					task_id, external_id, source, external_url, confidence, created_at
				) VALUES (
					${payload.taskId}, ${payload.externalId}, ${payload.source},
					${payload.externalUrl || null}, ${payload.confidence}, ${now}
				)
			`;
		},
	},

	// SPRINTS
	sprints: {
		async findOne(query: { externalId: string; source: string; userId: string }) {
			const rows = await sql`
				SELECT id FROM sprints
				WHERE external_id = ${query.externalId}
					AND external_source = ${query.source}
					AND user_id = ${query.userId}
				LIMIT 1
			`;
			return (rows[0] as { id: string } | undefined) || null;
		},

		async create(payload: {
			userId: string;
			externalId: string;
			source: string;
			name: string;
			startDate: Date | null;
			endDate: Date | null;
			status: string;
		}): Promise<{ id: string }> {
			const now = new Date();
			const rows = await sql`
				INSERT INTO sprints (
					user_id, external_id, external_source, title,
					start_date, end_date, status, created_at, updated_at
				) VALUES (
					${payload.userId}, ${payload.externalId}, ${payload.source},
					${payload.name}, ${payload.startDate}, ${payload.endDate},
					${payload.status}, ${now}, ${now}
				)
				RETURNING id
			`;
			return rows[0] as { id: string };
		},
	},

	// STANDUP TASKS (join table)
	standupTasks: {
		async create(payload: {
			standupId: string;
			taskId: string;
			snapshotSprintId: string | null;
			snapshotStatus: string | null;
			linkedAt: Date;
		}) {
			await sql`
				INSERT INTO standup_tasks (
					standup_id, task_id, snapshot_sprint_id, snapshot_status, linked_at
				) VALUES (
					${payload.standupId}, ${payload.taskId},
					${payload.snapshotSprintId}, ${payload.snapshotStatus}, ${payload.linkedAt}
				)
			`;
		},

		async findByStandup(standupId: string) {
			const rows = await sql`
				SELECT 
					st.task_id as "taskId",
					st.snapshot_sprint_id as "snapshotSprintId",
					st.snapshot_status as "snapshotStatus",
					st.linked_at as "linkedAt",
					t.title,
					t.status,
					t.story_points as "storyPoints"
				FROM standup_tasks st
				JOIN tasks t ON st.task_id = t.id
				WHERE st.standup_id = ${standupId}
			`;
			return rows;
		},
	},

	// STANDUPS
	standups: {
		async findOne(query: { id: string; userId: string }) {
			const rows = await sql`
				SELECT 
					id,
					user_id as "userId",
					snapshot_sprint_id as "snapshotSprintId",
					snapshot_milestone_id as "snapshotMilestoneId"
				FROM standups
				WHERE id = ${query.id} AND user_id = ${query.userId}
				LIMIT 1
			`;
			return rows[0] || null;
		},

		async updateSnapshotSprint(standupId: string, snapshotSprintId: string) {
			const now = new Date();
			await sql`
				UPDATE standups
				SET snapshot_sprint_id = ${snapshotSprintId}, updated_at = ${now}
				WHERE id = ${standupId}
			`;
		},
	},
};