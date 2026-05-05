import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	buildAuthUrl,
	exchangeCodeForTokens,
	getAccessibleResources,
	refreshAccessToken,
} from '../jiraOAuth';

const MOCK_CLIENT_ID = 'test-client-id';
const MOCK_CLIENT_SECRET = 'test-client-secret';
const MOCK_REDIRECT_URI = 'http://localhost:3000/auth/jira/callback';
const MOCK_STATE = 'random-csrf-state-string';

describe('buildAuthUrl', () => {
	it('returns the Atlassian authorization URL', () => {
		const url = new URL(buildAuthUrl({ clientId: MOCK_CLIENT_ID, redirectUri: MOCK_REDIRECT_URI, state: MOCK_STATE }));

		expect(url.origin + url.pathname).toBe('https://auth.atlassian.com/authorize');
	});

	it('includes required query parameters', () => {
		const url = new URL(buildAuthUrl({ clientId: MOCK_CLIENT_ID, redirectUri: MOCK_REDIRECT_URI, state: MOCK_STATE }));

		expect(url.searchParams.get('client_id')).toBe(MOCK_CLIENT_ID);
		expect(url.searchParams.get('redirect_uri')).toBe(MOCK_REDIRECT_URI);
		expect(url.searchParams.get('state')).toBe(MOCK_STATE);
		expect(url.searchParams.get('response_type')).toBe('code');
		expect(url.searchParams.get('audience')).toBe('api.atlassian.com');
		expect(url.searchParams.get('prompt')).toBe('consent');
	});

	it('includes the required scopes including offline_access', () => {
		const url = new URL(buildAuthUrl({ clientId: MOCK_CLIENT_ID, redirectUri: MOCK_REDIRECT_URI, state: MOCK_STATE }));
		const scopes = url.searchParams.get('scope')?.split(' ') ?? [];

		expect(scopes).toContain('read:jira-work');
		expect(scopes).toContain('read:jira-user');
		expect(scopes).toContain('offline_access');
	});
});

describe('exchangeCodeForTokens', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('exchanges a code for access and refresh tokens', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				access_token: 'mock-access-token',
				refresh_token: 'mock-refresh-token',
				expires_in: 3600,
				token_type: 'Bearer',
			}),
		}));

		const result = await exchangeCodeForTokens({
			code: 'auth-code-abc',
			clientId: MOCK_CLIENT_ID,
			clientSecret: MOCK_CLIENT_SECRET,
			redirectUri: MOCK_REDIRECT_URI,
		});

		expect(result.accessToken).toBe('mock-access-token');
		expect(result.refreshToken).toBe('mock-refresh-token');
		expect(result.expiresIn).toBe(3600);
	});

	it('posts to the correct Atlassian token endpoint', async () => {
		const mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({ access_token: 'token', refresh_token: 'refresh', expires_in: 3600 }),
		});
		vi.stubGlobal('fetch', mockFetch);

		await exchangeCodeForTokens({
			code: 'auth-code-abc',
			clientId: MOCK_CLIENT_ID,
			clientSecret: MOCK_CLIENT_SECRET,
			redirectUri: MOCK_REDIRECT_URI,
		});

		expect(mockFetch).toHaveBeenCalledWith(
			'https://auth.atlassian.com/oauth/token',
			expect.objectContaining({ method: 'POST' }),
		);
	});

	it('sends grant_type, code, client_id, client_secret, redirect_uri in the body', async () => {
		const mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({ access_token: 'token', refresh_token: 'refresh', expires_in: 3600 }),
		});
		vi.stubGlobal('fetch', mockFetch);

		await exchangeCodeForTokens({
			code: 'auth-code-abc',
			clientId: MOCK_CLIENT_ID,
			clientSecret: MOCK_CLIENT_SECRET,
			redirectUri: MOCK_REDIRECT_URI,
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.grant_type).toBe('authorization_code');
		expect(body.code).toBe('auth-code-abc');
		expect(body.client_id).toBe(MOCK_CLIENT_ID);
		expect(body.client_secret).toBe(MOCK_CLIENT_SECRET);
		expect(body.redirect_uri).toBe(MOCK_REDIRECT_URI);
	});

	it('throws when Atlassian returns an error response', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
			ok: false,
			status: 401,
			text: async () => 'Unauthorized',
		}));

		await expect(
			exchangeCodeForTokens({
				code: 'bad-code',
				clientId: MOCK_CLIENT_ID,
				clientSecret: MOCK_CLIENT_SECRET,
				redirectUri: MOCK_REDIRECT_URI,
			}),
		).rejects.toThrow();
	});
});

describe('getAccessibleResources', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('returns the list of accessible Jira cloud resources', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ([
				{ id: 'cloud-id-123', name: 'rbazelais', url: 'https://rbazelais.atlassian.net', scopes: [], avatarUrl: '' },
			]),
		}));

		const resources = await getAccessibleResources('mock-access-token');

		expect(resources).toHaveLength(1);
		expect(resources[0].id).toBe('cloud-id-123');
		expect(resources[0].name).toBe('rbazelais');
		expect(resources[0].url).toBe('https://rbazelais.atlassian.net');
	});

	it('calls the accessible-resources endpoint with the Bearer token', async () => {
		const mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ([{ id: 'cloud-id-123', name: 'site', url: 'https://site.atlassian.net', scopes: [], avatarUrl: '' }]),
		});
		vi.stubGlobal('fetch', mockFetch);

		await getAccessibleResources('mock-access-token');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.atlassian.com/oauth/token/accessible-resources',
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-access-token',
				}),
			}),
		);
	});

	it('throws when the request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
			ok: false,
			status: 401,
			text: async () => 'Unauthorized',
		}));

		await expect(getAccessibleResources('bad-token')).rejects.toThrow();
	});
});

describe('refreshAccessToken', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('exchanges a refresh token for a new access token', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				access_token: 'new-access-token',
				expires_in: 3600,
				token_type: 'Bearer',
			}),
		}));

		const result = await refreshAccessToken({
			refreshToken: 'mock-refresh-token',
			clientId: MOCK_CLIENT_ID,
			clientSecret: MOCK_CLIENT_SECRET,
		});

		expect(result.accessToken).toBe('new-access-token');
		expect(result.expiresIn).toBe(3600);
	});

	it('sends grant_type refresh_token in the body', async () => {
		const mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({ access_token: 'new-token', expires_in: 3600 }),
		});
		vi.stubGlobal('fetch', mockFetch);

		await refreshAccessToken({
			refreshToken: 'mock-refresh-token',
			clientId: MOCK_CLIENT_ID,
			clientSecret: MOCK_CLIENT_SECRET,
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.grant_type).toBe('refresh_token');
		expect(body.refresh_token).toBe('mock-refresh-token');
	});

	it('throws when the refresh token is invalid', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
			ok: false,
			status: 400,
			text: async () => 'invalid_grant',
		}));

		await expect(
			refreshAccessToken({
				refreshToken: 'expired-token',
				clientId: MOCK_CLIENT_ID,
				clientSecret: MOCK_CLIENT_SECRET,
			}),
		).rejects.toThrow();
	});
});
