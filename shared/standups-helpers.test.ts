import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock factories are hoisted to the top of the file before variable declarations run. vi.hoisted() ensures these objects exist in time.
const { mockWhere, mockChain, mockDb } = vi.hoisted(() => {
	const mockWhere = vi.fn();
	const mockChain = {
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: mockWhere,
	};
	const mockDb = { select: vi.fn().mockReturnValue(mockChain) };
	return { mockWhere, mockChain, mockDb };
});

vi.mock('drizzle-orm/vercel-postgres', () => ({
	drizzle: vi.fn(() => mockDb),
}));
vi.mock('@vercel/postgres', () => ({ sql: {} }));

import { buildTaskSnapshot, fetchLinkedTasks } from './standups-helpers.js';

function makeTask(overrides: Record<string, unknown> = {}) {
	return {
		id: 'task-1',
		userId: 'user-1',
		sprintId: null,
		currentSprintId: null,
		firstSprintId: null,
		title: 'My task',
		description: '',
		status: 'todo',
		priority: 'none',
		storyPoints: null,
		storyPointSystem: null,
		rolloverCount: 0,
		totalSprintsTouched: 0,
		externalId: null,
		externalSource: null,
		externalUrl: null,
		externalData: null,
		targetDate: null,
		completedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as ReturnType<typeof import('../drizzle/schema.js').tasks.$inferSelect>;
}

// ── buildTaskSnapshot ────────────────────────────────────────────────────────

describe('buildTaskSnapshot', () => {
	it('uses task fields when present', () => {
		const task = makeTask({ externalId: 'GH-1', externalUrl: 'https://gh/1', externalSource: 'github', status: 'in_progress' });
		const snap = buildTaskSnapshot(task, []);

		expect(snap).toEqual({
			title: 'My task',
			externalId: 'GH-1',
			externalUrl: 'https://gh/1',
			externalSource: 'github',
			status: 'in_progress',
		});
	});

	it('falls back to the primary external link when task has no external fields', () => {
		const task = makeTask();
		const snap = buildTaskSnapshot(task, [
			{ externalId: 'JIRA-42', externalUrl: 'https://jira/42', source: 'jira' },
		]);

		expect(snap.externalId).toBe('JIRA-42');
		expect(snap.externalUrl).toBe('https://jira/42');
		expect(snap.externalSource).toBe('jira');
	});

	it('prefers task fields over link fields', () => {
		const task = makeTask({ externalId: 'GH-1', externalSource: 'github' });
		const snap = buildTaskSnapshot(task, [
			{ externalId: 'JIRA-42', externalUrl: null, source: 'jira' },
		]);

		expect(snap.externalId).toBe('GH-1');
		expect(snap.externalSource).toBe('github');
	});

	it('sets null fields when neither task nor links have external data', () => {
		const snap = buildTaskSnapshot(makeTask(), []);

		expect(snap.externalId).toBeNull();
		expect(snap.externalUrl).toBeNull();
		expect(snap.externalSource).toBeNull();
	});
});

// ── fetchLinkedTasks ─────────────────────────────────────────────────────────

describe('fetchLinkedTasks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.select.mockReturnValue(mockChain);
		mockChain.from.mockReturnThis();
		mockChain.leftJoin.mockReturnThis();
	});

	it('returns an empty array when there are no linked rows', async () => {
		mockWhere.mockResolvedValueOnce([]);

		const result = await fetchLinkedTasks('standup-1');

		expect(result).toEqual([]);
	});

	it('returns deleted: true and uses the snapshot when task_id is null', async () => {
		// Simulates a row where ON DELETE SET NULL fired: task_id is null,
		// all task columns from the LEFT JOIN are null, snapshot is preserved.
		const deletedRow = {
			standupRowId: 'row-abc',
			taskId: null,
			taskSnapshot: { title: 'Old task', status: 'done', externalId: 'GH-9', externalUrl: 'https://gh/9', externalSource: 'github' },
			linkedAt: new Date(),
			id: null, userId: null, sprintId: null, currentSprintId: null,
			firstSprintId: null, title: null, description: null, status: null,
			priority: null, storyPoints: null, storyPointSystem: null,
			rolloverCount: null, totalSprintsTouched: null, externalId: null,
			externalSource: null, externalUrl: null, externalData: null,
			targetDate: null, completedAt: null, createdAt: null, updatedAt: null,
		};
		// No live tasks so no external-links query fires.
		mockWhere.mockResolvedValueOnce([deletedRow]);

		const result = await fetchLinkedTasks('standup-1');

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: 'deleted:row-abc',
			title: 'Old task',
			deleted: true,
			externalId: 'GH-9',
		});
	});

	it('renders "(deleted)" title when snapshot is null', async () => {
		const noSnapshotRow = {
			standupRowId: 'row-xyz',
			taskId: null,
			taskSnapshot: null,
			linkedAt: new Date(),
			id: null, userId: null, sprintId: null, currentSprintId: null,
			firstSprintId: null, title: null, description: null, status: null,
			priority: null, storyPoints: null, storyPointSystem: null,
			rolloverCount: null, totalSprintsTouched: null, externalId: null,
			externalSource: null, externalUrl: null, externalData: null,
			targetDate: null, completedAt: null, createdAt: null, updatedAt: null,
		};
		mockWhere.mockResolvedValueOnce([noSnapshotRow]);

		const result = await fetchLinkedTasks('standup-1');

		expect(result[0].title).toBe('(deleted)');
		expect(result[0].deleted).toBe(true);
	});

	it('returns deleted: false for a live task and fires the external-links query', async () => {
		const liveRow = {
			standupRowId: 'row-live',
			taskId: 'task-1',
			taskSnapshot: null,
			linkedAt: new Date(),
			id: 'task-1',
			userId: 'user-1', sprintId: null, currentSprintId: null,
			firstSprintId: null, title: 'Live task', description: '',
			status: 'todo', priority: 'none', storyPoints: null,
			storyPointSystem: null, rolloverCount: 0, totalSprintsTouched: 0,
			externalId: null, externalSource: null, externalUrl: null,
			externalData: null, targetDate: null, completedAt: null,
			createdAt: new Date(), updatedAt: new Date(),
		};
		mockWhere
			.mockResolvedValueOnce([liveRow])  // linked rows query
			.mockResolvedValueOnce([]);         // external links query

		const result = await fetchLinkedTasks('standup-1');

		expect(result).toHaveLength(1);
		expect(result[0].deleted).toBe(false);
		expect(result[0].title).toBe('Live task');
		// Confirms the external-links query was issued for live tasks
		expect(mockWhere).toHaveBeenCalledTimes(2);
	});
});
