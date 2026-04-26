import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { standupTasks, tasks, taskExternalLinks } from "../../drizzle/schema.js";
import { eq, inArray, getTableColumns } from "drizzle-orm";

const db = drizzle(sql);

type TaskRow = typeof tasks.$inferSelect;

export type LinkedTask = TaskRow & {
	externalLinks: { externalId: string; externalUrl: string | null; source: string }[];
};

export async function fetchLinkedTasks(standupId: string): Promise<LinkedTask[]> {
	const linkedRows = await db
		.select({ standupId: standupTasks.standupId, ...getTableColumns(tasks) })
		.from(standupTasks)
		.innerJoin(tasks, eq(standupTasks.taskId, tasks.id))
		.where(eq(standupTasks.standupId, standupId));

	if (linkedRows.length === 0) return [];

	const taskIds = linkedRows.map(r => r.id);
	const linkRows = await db
		.select()
		.from(taskExternalLinks)
		.where(inArray(taskExternalLinks.taskId, taskIds));

	const linksByTaskId = linkRows.reduce<Record<string, typeof linkRows>>((acc, link) => {
		(acc[link.taskId] ??= []).push(link);
		return acc;
	}, {});

	return linkedRows.map(({ standupId: _s, ...task }) => ({
		...(task as TaskRow),
		externalLinks: (linksByTaskId[task.id] ?? []).map(l => ({
			externalId: l.externalId,
			externalUrl: l.externalUrl,
			source: l.source,
		})),
	}));
}
