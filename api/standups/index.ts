import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { standups, standupTasks, tasks, taskExternalLinks as taskLinks } from "../../drizzle/schema.js";
import { createStandupSchema, validateBody } from "../../drizzle/validation.js";
import { eq, desc, inArray, getTableColumns } from "drizzle-orm";
import { buildTaskSnapshot, fetchLinkedTasks } from "../../shared/standups-helpers.js";
import type { TaskSnapshot } from "../../shared/standups-helpers.js";
import { db as sharedDb } from "../../shared/db.js";
import { createJiraClient } from "../../shared/integrations/jira-client.js";
import { createJiraAdapter } from "../../shared/integrations/jira-adapter.js";
import type { GitHubCommit, LinkedTask } from "../../shared/types.js";

const db = drizzle(sql);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "User ID is required" });
	}

	// GET: Fetch all standups for user, enriched with linked tasks via junction table
	if (req.method === "GET") {
		try {
			const userStandups = await db
				.select()
				.from(standups)
				.where(eq(standups.userId, userId))
				.orderBy(desc(standups.createdAt));

			const linkedTasksMap: Record<string, LinkedTask[]> = {};

			if (userStandups.length > 0) {
				const standupIds = userStandups.map(s => s.id);

				const linkedRows = await db
					.select({
						standupId: standupTasks.standupId,
						standupRowId: standupTasks.id,
						taskId: standupTasks.taskId,
						taskSnapshot: standupTasks.taskSnapshot,
						...getTableColumns(tasks),
					})
					.from(standupTasks)
					.leftJoin(tasks, eq(standupTasks.taskId, tasks.id))
					.where(inArray(standupTasks.standupId, standupIds));

				for (const row of linkedRows) {
					const { standupId, standupRowId, taskId, taskSnapshot, ...taskFields } = row;
					if (!linkedTasksMap[standupId]) linkedTasksMap[standupId] = [];

					if (taskId !== null && taskFields.id !== null) {
						linkedTasksMap[standupId].push(taskFields as unknown as LinkedTask);
					} else {
						const snap = taskSnapshot as TaskSnapshot | null;
						linkedTasksMap[standupId].push({
							id: `deleted:${standupRowId}`,
							title: snap?.title ?? '(deleted)',
							externalId: snap?.externalId ?? null,
							externalUrl: snap?.externalUrl ?? null,
							externalSource: snap?.externalSource ?? null,
							externalLinks: snap?.externalId
								? [{ externalId: snap.externalId, externalUrl: snap.externalUrl ?? null, source: snap.externalSource ?? 'github' }]
								: [],
							deleted: true as const,
						});
					}
				}
			}

			const enriched = userStandups.map(s => ({
				...s,
				linkedTasks: linkedTasksMap[s.id] ?? [],
			}));

			return res.status(200).json(enriched);
		} catch (error) {
			console.error("Failed to fetch standups:", error);
			return res.status(500).json({
				error: "Failed to fetch standups",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// POST: Create new standup and link tasks via junction table
	if (req.method === "POST") {
		const validation = validateBody(createStandupSchema, req.body);
		if (!validation.success) {
			return res.status(400).json({ error: validation.error });
		}

		try {
			const { repoFullName, date, workCompleted, workPlanned, blockers, commits, taskIds } = validation.data;

			const [newStandup] = await db
				.insert(standups)
				.values({
					userId,
					repoFullName,
					date,
					workCompleted,
					workPlanned,
					blockers,
					commits,
				})
				.returning();

			// Link tasks via junction table — fetch full rows + external links so we
			// can write a snapshot at link time. If the task is later deleted,
			// the snapshot preserves its display data for historical standups.
			const validTaskIds = taskIds.filter(id => UUID_RE.test(id));
			if (validTaskIds.length > 0) {
				const existingTasks = await db
					.select()
					.from(tasks)
					.where(inArray(tasks.id, validTaskIds));

				if (existingTasks.length > 0) {
					const linkRows = await db
						.select()
						.from(taskLinks)
						.where(inArray(taskLinks.taskId, existingTasks.map(t => t.id)));

					const linksByTaskId = linkRows.reduce<Record<string, typeof linkRows>>((acc, l) => {
						(acc[l.taskId] ??= []).push(l);
						return acc;
					}, {});

					await db.insert(standupTasks).values(
						existingTasks.map(task => ({
							standupId: newStandup.id,
							taskId: task.id,
							taskSnapshot: buildTaskSnapshot(
								task,
								(linksByTaskId[task.id] ?? []).map(l => ({
									externalId: l.externalId,
									externalUrl: l.externalUrl,
									source: l.source,
								}))
							),
						}))
					);
				}
			}

			const linkedTasks = await fetchLinkedTasks(newStandup.id);

			// Post standup comment to Jira for any linked Jira tasks (best-effort)
			const jiraLinks = linkedTasks.flatMap(task =>
				(task.externalLinks ?? [])
					.filter(link => link.source === 'jira')
					.map(link => link.externalId)
			);

			let jiraCommentFailed = false;
			if (jiraLinks.length > 0) {
				try {
					const jiraClient = await createJiraClient(userId, sharedDb);
					if (jiraClient) {
						const adapter = createJiraAdapter(jiraClient, jiraClient.siteUrl);
						const results = await Promise.allSettled(
							jiraLinks.map(issueKey =>
								adapter.postStandupComment(issueKey, {
									date: newStandup.date,
									workCompleted: newStandup.workCompleted,
									commits: newStandup.commits as GitHubCommit[],
								})
							)
						);
						jiraCommentFailed = results.some(r => r.status === 'rejected');
						results.forEach((r, i) => {
							if (r.status === 'rejected') {
								console.error(`Failed to post Jira comment for ${jiraLinks[i]}:`, r.reason);
							}
						});
					}
				} catch (err) {
					console.error('Failed to create Jira client for standup comment:', err);
					jiraCommentFailed = true;
				}
			}

			return res.status(201).json({ ...newStandup, linkedTasks, ...(jiraCommentFailed && { jiraCommentFailed: true }) });
		} catch (error) {
			console.error("Failed to create standup:", error);
			return res.status(500).json({
				error: "Failed to create standup",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
