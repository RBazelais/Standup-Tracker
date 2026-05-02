import { refreshAccessToken } from '../../src/lib/jira/jiraOAuth.js';

const JIRA_API_BASE = 'https://api.atlassian.com/ex/jira';
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface JiraIntegration {
	accessToken: string;
	refreshToken: string | null;
	tokenExpiresAt: Date | null;
	metadata: Record<string, unknown> | null;
	accountName: string | null;
}

interface JiraClientDb {
	integrations: {
		findOne: (query: { userId: string; source: string }) => Promise<JiraIntegration | null>;
		upsert: (payload: {
			userId: string;
			source: string;
			accessToken: string;
			refreshToken?: string;
			tokenExpiresAt?: Date;
			metadata?: Record<string, unknown>;
			accountName?: string;
		}) => Promise<void>;
	};
}

export interface JiraClient {
	fetch: (path: string, init?: RequestInit) => Promise<Response>;
	cloudId: string;
	siteUrl: string;
}

export async function createJiraClient(
	userId: string,
	db: JiraClientDb
): Promise<JiraClient | null> {
	const integration = await db.integrations.findOne({ userId, source: 'jira' });
	if (!integration) return null;

	const meta = integration.metadata as { cloudId?: string; siteUrl?: string } | null;
	const cloudId = meta?.cloudId;
	if (!cloudId) return null;
	const siteUrl = meta?.siteUrl ?? '';

	let { accessToken } = integration;

	if (needsRefresh(integration.tokenExpiresAt)) {
		if (!integration.refreshToken) return null;

		const refreshed = await refreshAccessToken({
			refreshToken: integration.refreshToken,
			clientId: process.env.JIRA_CLIENT_ID!,
			clientSecret: process.env.JIRA_CLIENT_SECRET!,
		});

		accessToken = refreshed.accessToken;

		await db.integrations.upsert({
			userId,
			source: 'jira',
			accessToken: refreshed.accessToken,
			refreshToken: integration.refreshToken,
			tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
			metadata: integration.metadata ?? undefined,
			accountName: integration.accountName ?? undefined,
		});
	}

	return {
		cloudId,
		siteUrl,
		fetch: (path: string, init?: RequestInit) =>
			fetch(`${JIRA_API_BASE}/${cloudId}/rest/api/3${path}`, {
				...init,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
					...(init?.headers ?? {}),
				},
			}),
	};
}

function needsRefresh(tokenExpiresAt: Date | null): boolean {
	if (!tokenExpiresAt) return false;
	return Date.now() > new Date(tokenExpiresAt).getTime() - REFRESH_BUFFER_MS;
}
