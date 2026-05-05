import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Helpers ──────────────────────────────────────────────────────────────────

function createMockReq(overrides: {
	method?: string;
	query?: Record<string, string>;
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
		status: vi.fn(),
		json: vi.fn(),
		redirect: vi.fn(),
		setHeader: vi.fn(),
	};
	res.status.mockImplementation((code: number) => { res._status = code; return res; });
	res.json.mockImplementation((data: unknown) => { res._jsonData = data; return res; });
	res.redirect.mockImplementation((code: number, url: string) => { res._redirectArgs = [code, url]; return res; });
	res.setHeader.mockImplementation((name: string, value: string) => { res._headers[name] = value; return res; });
	return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const MOCK_STATE = 'deadbeef-0000-0000-0000-000000000001' as ReturnType<typeof crypto.randomUUID>;

describe('GET /api/auth/jira', () => {
	beforeEach(async () => {
		vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(MOCK_STATE);
		process.env.JIRA_CLIENT_ID = 'test-jira-client-id';
		process.env.VITE_APP_URL = 'http://localhost:3000';
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete process.env.JIRA_CLIENT_ID;
		delete process.env.VITE_APP_URL;
	});

	it('redirects to the Atlassian authorization URL', async () => {
		const { default: handler } = await import('../jira.js');
		const req = createMockReq({ query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.redirect).toHaveBeenCalledWith(302, expect.stringContaining('https://auth.atlassian.com/authorize'));
	});

	it('includes the correct query parameters in the redirect URL', async () => {
		const { default: handler } = await import('../jira.js');
		const req = createMockReq({ query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		const redirectUrl = new URL(res._redirectArgs![1]);
		expect(redirectUrl.searchParams.get('client_id')).toBe('test-jira-client-id');
		expect(redirectUrl.searchParams.get('state')).toBe(MOCK_STATE);
		expect(redirectUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/jira/callback');
		expect(redirectUrl.searchParams.get('response_type')).toBe('code');
		expect(redirectUrl.searchParams.get('audience')).toBe('api.atlassian.com');
	});

	it('sets a jira_oauth_state cookie with HttpOnly and SameSite=Lax', async () => {
		const { default: handler } = await import('../jira.js');
		const req = createMockReq({ query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('jira_oauth_state='));
		expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('HttpOnly'));
		expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('SameSite=Lax'));
	});

	it('encodes both the state nonce and userId in the cookie', async () => {
		const { default: handler } = await import('../jira.js');
		const req = createMockReq({ query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		const cookieHeader = res._headers['Set-Cookie'];
		// Cookie value is everything between the first '=' and the first ';'
		const rawValue = cookieHeader.split(';')[0].replace(/^jira_oauth_state=/, '');
		const decoded = JSON.parse(decodeURIComponent(rawValue));

		expect(decoded.state).toBe(MOCK_STATE);
		expect(decoded.userId).toBe('user-123');
	});

	it('returns 400 when userId is not provided', async () => {
		const { default: handler } = await import('../jira.js');
		const req = createMockReq({ query: {} });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
	});

	it('returns 500 when JIRA_CLIENT_ID is not configured', async () => {
		delete process.env.JIRA_CLIENT_ID;
		const { default: handler } = await import('../jira.js');
		const req = createMockReq({ query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(500);
	});

	it('returns 405 for non-GET requests', async () => {
		const { default: handler } = await import('../jira.js');
		const req = createMockReq({ method: 'POST', query: { userId: 'user-123' } });
		const res = createMockRes();

		await handler(req, res as unknown as VercelResponse);

		expect(res.status).toHaveBeenCalledWith(405);
	});
});
