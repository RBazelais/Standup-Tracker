const ATLASSIAN_AUTH_URL = 'https://auth.atlassian.com/authorize';
const ATLASSIAN_TOKEN_URL = 'https://auth.atlassian.com/oauth/token';
const ATLASSIAN_RESOURCES_URL = 'https://api.atlassian.com/oauth/token/accessible-resources';

const SCOPES = ['read:jira-work', 'read:jira-user', 'offline_access'];

export interface BuildAuthUrlParams {
	clientId: string;
	redirectUri: string;
	state: string;
}

export interface TokenResponse {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

export interface RefreshResponse {
	accessToken: string;
	expiresIn: number;
}

export interface AccessibleResource {
	id: string;
	name: string;
	url: string;
	scopes: string[];
	avatarUrl: string;
}

export function buildAuthUrl({ clientId, redirectUri, state }: BuildAuthUrlParams): string {
	const url = new URL(ATLASSIAN_AUTH_URL);
	url.searchParams.set('audience', 'api.atlassian.com');
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('scope', SCOPES.join(' '));
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('state', state);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('prompt', 'consent');
	return url.toString();
}

export async function exchangeCodeForTokens({
	code,
	clientId,
	clientSecret,
	redirectUri,
}: {
	code: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}): Promise<TokenResponse> {
	const res = await fetch(ATLASSIAN_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'authorization_code',
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Token exchange failed (${res.status}): ${text}`);
	}

	const data = await res.json();
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in,
	};
}

export async function getAccessibleResources(accessToken: string): Promise<AccessibleResource[]> {
	const res = await fetch(ATLASSIAN_RESOURCES_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/json',
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to fetch accessible resources (${res.status}): ${text}`);
	}

	return res.json();
}

export async function refreshAccessToken({
	refreshToken,
	clientId,
	clientSecret,
}: {
	refreshToken: string;
	clientId: string;
	clientSecret: string;
}): Promise<RefreshResponse> {
	const res = await fetch(ATLASSIAN_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'refresh_token',
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken,
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Token refresh failed (${res.status}): ${text}`);
	}

	const data = await res.json();
	return {
		accessToken: data.access_token,
		expiresIn: data.expires_in,
	};
}