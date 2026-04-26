import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildAuthUrl } from '../../src/lib/jira/jiraOAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const userId = req.query.userId as string | undefined;
	if (!userId) {
		return res.status(400).json({ error: 'userId is required' });
	}

	const clientId = process.env.JIRA_CLIENT_ID;
	if (!clientId) {
		return res.status(500).json({ error: 'Jira OAuth is not configured' });
	}

	const appUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
	const redirectUri = `${appUrl}/api/auth/jira/callback`;
	const state = crypto.randomUUID();
	const secure = appUrl.startsWith('https') ? '; Secure' : '';

	const cookieValue = encodeURIComponent(JSON.stringify({ state, userId }));
	res.setHeader(
		'Set-Cookie',
		`jira_oauth_state=${cookieValue}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${secure}`,
	);

	const authUrl = buildAuthUrl({ clientId, redirectUri, state });
	return res.redirect(302, authUrl);
}
