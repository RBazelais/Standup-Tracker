import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../lib/db', () => ({
	db: {
		integrations: {
			delete: vi.fn(),
		},
	},
}));

import { db } from '../../lib/db';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockReq(overrides: {
	method?: string;
	query?: Record<string, string>;
} = {}): VercelRequest {
	return {
		method: 'DELETE',
		query: {},
		...overrides,
	} as unknown as VercelRequest;
}

function createMockRes() {
	const res = {
		_status: 200,
		_jsonData: null as unknown,
	};
	res.status = vi.fn().mockImplementation((code: number) => { res._status = code; return res; });
	res.json = vi.fn().mockImplementation((data: unknown) => { res._jsonData = data; return res; });
	return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/integrations/disconnect', () => {
	beforeEach(() => {
		vi.mocked(db.integrations.delete).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('returns 405 for non-DELETE requests', async () => {
		const { default: handler } = await import('../disconnect.js');
		const req = createMockReq({ method: 'GET' });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(405);
	});

	it('returns 400 when userId is missing', async () => {
		const { default: handler } = await import('../disconnect.js');
		const req = createMockReq({ query: { source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('returns 400 when source is missing', async () => {
		const { default: handler } = await import('../disconnect.js');
		const req = createMockReq({ query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('deletes the integration and returns 200', async () => {
		const { default: handler } = await import('../disconnect.js');
		const req = createMockReq({ query: { userId: 'user-123', source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(db.integrations.delete).toHaveBeenCalledWith({ userId: 'user-123', source: 'jira' });
		expect(res.status).toHaveBeenCalledWith(200);
	});
});
