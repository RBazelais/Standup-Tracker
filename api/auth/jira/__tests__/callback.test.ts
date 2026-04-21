import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../../../src/lib/jira/jiraOAuth', () => ({
	exchangeCodeForTokens: vi.fn(),
	getAccessibleResources: vi.fn(),
}));

vi.mock('../../../lib/db', () => ({
	db: {
		integrations: {
			upsert: vi.fn(),
		},
	},
}));

import { exchangeCodeForTokens, getAccessibleResources } from '../../../../src/lib/jira/jiraOAuth';
import { db } from '../../../lib/db';

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_STATE = 'csrf-state-abcd-1234';
const MOCK_USER_ID = 'user-abc';

/** Builds a cookie header string for the jira_oauth_state cookie. */
function makeStateCookie(state = MOCK_STATE, userId = MOCK_USER_ID): string {
	const value = encodeURIComponent(JSON.stringify({ state, userId }));
	return `jira_oauth_state=${value}`;
}

function createMockReq(overrides: {
	method?: string;
	query?: Record<string, string>;
	headers?: Record<string, string>;
} = {}): VercelRequest {
	return {
		method: 'GET',
		query: {},
		headers: {},
		...overrides,
	} as unknown as VercelRequest;
}

function createMockRes() {
	const res = {
		_status: 200,
		_headers: {} as Record<string, string>,
		_redirectArgs: null as [number, string] | null,
		_jsonData: null as unknown,
	};
	res.status = vi.fn().mockImplementation((code: number) => { res._status = code; return res; });
	res.json = vi.fn().mockImplementation((data: unknown) => { res._jsonData = data; return res; });
	res.redirect = vi.fn().mockImplementation((code: number, url: string) => { res._redirectArgs = [code, url]; return res; });
	res.setHeader = vi.fn().mockImplementation((name: string, value: string) => { res._headers[name] = value; return res; });
	return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/auth/jira/callback', () => {
	beforeEach(() => {
		process.env.JIRA_CLIENT_ID = 'test-client-id';
		process.env.JIRA_CLIENT_SECRET = 'test-client-secret';
		process.env.VITE_APP_URL = 'http://localhost:3000';

		vi.mocked(exchangeCodeForTokens).mockResolvedValue({
			accessToken: 'mock-access-token',
			refreshToken: 'mock-refresh-token',
			expiresIn: 3600,
		});

		vi.mocked(getAccessibleResources).mockResolvedValue([
			{ id: 'cloud-id-123', name: 'mysite', url: 'https://mysite.atlassian.net', scopes: [], avatarUrl: '' },
		]);

		vi.mocked(db.integrations.upsert).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
		delete process.env.JIRA_CLIENT_ID;
		delete process.env.JIRA_CLIENT_SECRET;
		delete process.env.VITE_APP_URL;
	});

	// ── Happy path ──────────────────────────────────────────────────────────────

	it('exchanges the code for tokens and redirects to /settings?jira=connected', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { code: 'auth-code-abc', state: MOCK_STATE },
			headers: { cookie: makeStateCookie() },
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(exchangeCodeForTokens).toHaveBeenCalledWith(expect.objectContaining({
			code: 'auth-code-abc',
			clientId: 'test-client-id',
			clientSecret: 'test-client-secret',
		}));
		expect(res.redirect).toHaveBeenCalledWith(302, expect.stringContaining('/settings?jira=connected'));
	});

	it('upserts the integration with tokens and cloudId metadata', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { code: 'auth-code-abc', state: MOCK_STATE },
			headers: { cookie: makeStateCookie() },
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(db.integrations.upsert).toHaveBeenCalledWith(expect.objectContaining({
			userId: MOCK_USER_ID,
			source: 'jira',
			accessToken: 'mock-access-token',
			refreshToken: 'mock-refresh-token',
			metadata: expect.objectContaining({ cloudId: 'cloud-id-123', siteName: 'mysite' }),
		}));
	});

	it('clears the jira_oauth_state cookie after a successful exchange', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { code: 'auth-code-abc', state: MOCK_STATE },
			headers: { cookie: makeStateCookie() },
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('Max-Age=0'));
	});

	// ── Error and edge cases ────────────────────────────────────────────────────

	it('redirects to /settings?jira=denied when the user denies access', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { error: 'access_denied' },
			headers: { cookie: makeStateCookie() },
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.redirect).toHaveBeenCalledWith(302, expect.stringContaining('/settings?jira=denied'));
	});

	it('returns 400 when the code param is missing', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { state: MOCK_STATE },
			headers: { cookie: makeStateCookie() },
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('returns 400 when the state param is missing', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { code: 'auth-code-abc' },
			headers: { cookie: makeStateCookie() },
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('returns 400 when the jira_oauth_state cookie is absent', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { code: 'auth-code-abc', state: MOCK_STATE },
			headers: {},
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('returns 400 when the state param does not match the cookie', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { code: 'auth-code-abc', state: 'wrong-state-value' },
			headers: { cookie: makeStateCookie(MOCK_STATE) }, // cookie has correct state, query has wrong
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('redirects to /settings?jira=error when the token exchange throws', async () => {
		vi.mocked(exchangeCodeForTokens).mockRejectedValueOnce(new Error('Token exchange failed'));
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({
			query: { code: 'bad-code', state: MOCK_STATE },
			headers: { cookie: makeStateCookie() },
		});
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.redirect).toHaveBeenCalledWith(302, expect.stringContaining('/settings?jira=error'));
	});

	it('returns 405 for non-GET requests', async () => {
		const { default: handler } = await import('../callback.js');
		const req = createMockReq({ method: 'POST' });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(405);
	});
});
