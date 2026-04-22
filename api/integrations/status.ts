import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const userId = req.query.userId as string | undefined;
	const source = req.query.source as string | undefined;

	if (!userId || !source) {
		return res.status(400).json({ error: 'userId and source are required' });
	}

	const integration = await db.integrations.findOne({ userId, source });

	return res.status(200).json({
		connected: Boolean(integration?.accessToken),
		accountName: integration?.accountName ?? null,
	});
}
