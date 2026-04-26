import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Module mocks 

vi.mock('../../../shared/db', () => ({
	db: {
		integrations: {
			findOne: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

import { db } from '../../../shared/db';

// Helpers 

function createMockReq(overrides: {
	method?: string;
	query?: Record<string, string>;
} = {}): VercelRequest {
	return {
		method: 'GET',
		query: {},
		...overrides,
	} as unknown as VercelRequest;
}

function createMockRes() {
	const res = {
		_status: 200 as number,
		_jsonData: null as unknown,
		status: vi.fn(),
		json: vi.fn(),
	};
	res.status.mockImplementation((code: number) => { res._status = code; return res; });
	res.json.mockImplementation((data: unknown) => { res._jsonData = data; return res; });
	return res;
}

// Tests 

describe('GET /api/integrations', () => {
	beforeEach(() => {
		vi.mocked(db.integrations.findOne).mockResolvedValue(null);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('returns 400 when userId is missing', async () => {
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ query: { source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('returns 400 when source is missing', async () => {
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('returns connected:false and accountName:null when no integration exists', async () => {
		vi.mocked(db.integrations.findOne).mockResolvedValue(null);
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ query: { userId: 'user-123', source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ connected: false, accountName: null });
	});

	it('returns connected:true and accountName when integration exists', async () => {
		vi.mocked(db.integrations.findOne).mockResolvedValue({
			accessToken: 'tok-abc',
			refreshToken: 'ref-xyz',
			tokenExpiresAt: null,
			metadata: { cloudId: 'cloud-1', siteName: 'mysite' },
			accountName: 'mysite',
		});
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ query: { userId: 'user-123', source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ connected: true, accountName: 'mysite' });
	});

	it('queries the db with the correct userId and source', async () => {
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ query: { userId: 'user-456', source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(db.integrations.findOne).toHaveBeenCalledWith({ userId: 'user-456', source: 'jira' });
	});
});

describe('DELETE /api/integrations', () => {
	beforeEach(() => {
		vi.mocked(db.integrations.delete).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('returns 400 when userId is missing', async () => {
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ method: 'DELETE', query: { source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('returns 400 when source is missing', async () => {
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ method: 'DELETE', query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('deletes the integration and returns 200', async () => {
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ method: 'DELETE', query: { userId: 'user-123', source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(db.integrations.delete).toHaveBeenCalledWith({ userId: 'user-123', source: 'jira' });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ disconnected: true });
	});
});

describe('unsupported methods', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('returns 405 for POST requests', async () => {
		const { default: handler } = await import('../index.js');
		const req = createMockReq({ method: 'POST', query: { userId: 'user-123', source: 'jira' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(405);
	});
});