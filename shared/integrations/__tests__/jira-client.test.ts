import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJiraClient } from '../jira-client';
import type { JiraIntegration } from '../jira-client';

vi.mock('../../../src/lib/jira/jiraOAuth.js', () => ({
	refreshAccessToken: vi.fn(),
}));

import { refreshAccessToken } from '../../../src/lib/jira/jiraOAuth.js';

const FRESH_INTEGRATION: JiraIntegration = {
	accessToken: 'access-token-123',
	refreshToken: 'refresh-token-456',
	tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
	metadata: { cloudId: 'cloud-abc', siteName: 'my-site' },
	accountName: 'my-site',
};

function makeDb(integration = FRESH_INTEGRATION as typeof FRESH_INTEGRATION | null) {
	return {
		integrations: {
			findOne: vi.fn().mockResolvedValue(integration),
			upsert: vi.fn().mockResolvedValue(undefined),
		},
	};
}

describe('createJiraClient', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns null when no integration found', async () => {
		const client = await createJiraClient('user-1', makeDb(null));
		expect(client).toBeNull();
	});

	it('returns null when metadata has no cloudId', async () => {
		const client = await createJiraClient('user-1', makeDb({ ...FRESH_INTEGRATION, metadata: {} }));
		expect(client).toBeNull();
	});

	it('returns a client with cloudId when token is fresh', async () => {
		const client = await createJiraClient('user-1', makeDb());
		expect(client).not.toBeNull();
		expect(client?.cloudId).toBe('cloud-abc');
	});

	it('does not refresh when token is not expiring soon', async () => {
		const db = makeDb();
		await createJiraClient('user-1', db);
		expect(refreshAccessToken).not.toHaveBeenCalled();
		expect(db.integrations.upsert).not.toHaveBeenCalled();
	});

	it('refreshes the token when expiring within 5 minutes', async () => {
		vi.stubEnv('JIRA_CLIENT_ID', 'test-client-id');
		vi.stubEnv('JIRA_CLIENT_SECRET', 'test-client-secret');

		const expiringSoon = {
			...FRESH_INTEGRATION,
			tokenExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
		};
		const db = makeDb(expiringSoon);
		vi.mocked(refreshAccessToken).mockResolvedValue({ accessToken: 'new-token', expiresIn: 3600 });

		const client = await createJiraClient('user-1', db);

		expect(refreshAccessToken).toHaveBeenCalledWith({
			refreshToken: 'refresh-token-456',
			clientId: 'test-client-id',
			clientSecret: 'test-client-secret',
		});
		expect(db.integrations.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ accessToken: 'new-token' })
		);
		expect(client).not.toBeNull();
	});

	it('uses the refreshed token for subsequent requests', async () => {
		const expiringSoon = {
			...FRESH_INTEGRATION,
			tokenExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
		};
		const db = makeDb(expiringSoon);
		vi.mocked(refreshAccessToken).mockResolvedValue({ accessToken: 'new-token', expiresIn: 3600 });
		const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
		vi.stubGlobal('fetch', mockFetch);

		const client = await createJiraClient('user-1', db);
		await client?.fetch('/issue/STUP-1');

		expect(mockFetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer new-token' }),
			})
		);
		vi.unstubAllGlobals();
	});

	it('returns null when token is expired and there is no refresh token', async () => {
		const expired = {
			...FRESH_INTEGRATION,
			tokenExpiresAt: new Date(Date.now() - 1000),
			refreshToken: null,
		};
		const client = await createJiraClient('user-1', makeDb(expired));
		expect(client).toBeNull();
	});

	it('builds the correct Jira API URL', async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
		vi.stubGlobal('fetch', mockFetch);

		const client = await createJiraClient('user-1', makeDb());
		await client?.fetch('/issue/STUP-1');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.atlassian.com/ex/jira/cloud-abc/rest/api/3/issue/STUP-1',
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: 'Bearer access-token-123',
					Accept: 'application/json',
				}),
			})
		);
		vi.unstubAllGlobals();
	});
});
