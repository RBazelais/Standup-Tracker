import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { standupTasks, tasks, taskExternalLinks } from "../drizzle/schema.js";
import { eq, inArray, getTableColumns } from "drizzle-orm";
import type { LinkedTask } from "./types.js";

const db = drizzle(sql);

type TaskRow = typeof tasks.$inferSelect;

export type TaskSnapshot = {
	title: string;
	externalId: string | null;
	externalUrl: string | null;
	externalSource: string | null;
	status: string | null;
};

export function buildTaskSnapshot(
	task: TaskRow,
	externalLinks: { externalId: string; externalUrl: string | null; source: string }[]
): TaskSnapshot {
	const primaryLink = externalLinks[0] ?? null;
	return {
		title: task.title,
		externalId: task.externalId ?? primaryLink?.externalId ?? null,
		externalUrl: task.externalUrl ?? primaryLink?.externalUrl ?? null,
		externalSource: task.externalSource ?? primaryLink?.source ?? null,
		status: task.status ?? null,
	};
}

export async function fetchLinkedTasks(standupId: string): Promise<LinkedTask[]> {
	const linkedRows = await db
		.select({
			standupRowId: standupTasks.id,
			taskId: standupTasks.taskId,
			taskSnapshot: standupTasks.taskSnapshot,
			linkedAt: standupTasks.linkedAt,
			...getTableColumns(tasks),
		})
		.from(standupTasks)
		.leftJoin(tasks, eq(standupTasks.taskId, tasks.id))
		.where(eq(standupTasks.standupId, standupId));

	if (linkedRows.length === 0) return [];

	// Collect IDs of tasks that still exist
	const liveTaskIds = linkedRows
		.filter(r => r.taskId !== null && r.id !== null)
		.map(r => r.id!);

	const linkRows = liveTaskIds.length > 0
		? await db.select().from(taskExternalLinks).where(inArray(taskExternalLinks.taskId, liveTaskIds))
		: [];

	const linksByTaskId = linkRows.reduce<Record<string, typeof linkRows>>((acc, link) => {
		(acc[link.taskId] ??= []).push(link);
		return acc;
	}, {});

	return linkedRows.map((row) => {
		const { standupRowId, taskId, taskSnapshot, linkedAt, ...taskFields } = row;

		// Task still exists — return the full live task
		if (taskId !== null && taskFields.id !== null) {
			const task = taskFields as TaskRow;
			return {
				...task,
				deleted: false as const,
				externalLinks: (linksByTaskId[task.id] ?? []).map(l => ({
					externalId: l.externalId,
					externalUrl: l.externalUrl,
					source: l.source,
				})),
			};
		}

		// Task was deleted — synthesize a display record from the frozen snapshot
		const snap = taskSnapshot as TaskSnapshot | null;
		return {
			id: `deleted:${standupRowId}`,
			title: snap?.title ?? '(deleted)',
			externalId: snap?.externalId ?? null,
			externalUrl: snap?.externalUrl ?? null,
			externalSource: snap?.externalSource ?? null,
			externalLinks: snap?.externalId
				? [{ externalId: snap.externalId, externalUrl: snap.externalUrl ?? null, source: snap.externalSource ?? 'github' }]
				: [],
			deleted: true as const,
		};
	});
}
