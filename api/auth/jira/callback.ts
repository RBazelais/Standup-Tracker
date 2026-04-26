import type { VercelRequest, VercelResponse } from '@vercel/node';
import { exchangeCodeForTokens, getAccessibleResources } from '../../../src/lib/jira/jiraOAuth.js';
import { db } from '../../../shared/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { code, state, error } = req.query as Record<string, string>;

	if (error) {
		const destination = error === 'access_denied' ? '/settings?jira=denied' : '/settings?jira=error';
		return res.redirect(302, destination);
	}

	if (!code || !state) {
		return res.status(400).json({ error: 'Missing code or state' });
	}

	// Read the state cookie set by api/auth/jira.ts
	const cookieHeader = (req.headers.cookie as string | undefined) ?? '';
	const rawCookie = cookieHeader.split(';').find(c => c.trim().startsWith('jira_oauth_state='));
	if (!rawCookie) {
		return res.status(400).json({ error: 'Missing OAuth state cookie' });
	}

	let cookieData: { state: string; userId: string };
	try {
		const rawValue = rawCookie.trim().replace(/^jira_oauth_state=/, '');
		cookieData = JSON.parse(decodeURIComponent(rawValue));
	} catch {
		return res.status(400).json({ error: 'Invalid OAuth state cookie' });
	}

	if (state !== cookieData.state) {
		return res.status(400).json({ error: 'State mismatch — possible CSRF attack' });
	}

	const clientId = process.env.JIRA_CLIENT_ID!;
	const clientSecret = process.env.JIRA_CLIENT_SECRET!;
	const appUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
	const redirectUri = `${appUrl}/api/auth/jira/callback`;
	const secure = appUrl.startsWith('https') ? '; Secure' : '';

	try {
		const tokens = await exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri });

		const resources = await getAccessibleResources(tokens.accessToken);
		if (!resources.length) {
			return res.status(400).json({ error: 'No accessible Jira resources found' });
		}

		const { id: cloudId, name: siteName } = resources[0];
		const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

		await db.integrations.upsert({
			userId: cookieData.userId,
			source: 'jira',
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			tokenExpiresAt,
			metadata: { cloudId, siteName },
			accountName: siteName,
		});

		res.setHeader('Set-Cookie', `jira_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);

		return res.redirect(302, '/settings?jira=connected');
	} catch (err) {
		console.error('Jira OAuth callback error:', err);
		return res.redirect(302, '/settings?jira=error');
	}
}