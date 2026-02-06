import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const clientId = process.env.GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_CLIENT_SECRET;
	
	// Only allow POST requests
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { code } = req.body;

	if (!code) {
		return res.status(400).json({ error: "Code is required" });
	}

	try {
		// Exchange code for access token
		const tokenResponse = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					client_id: clientId,
					client_secret: clientSecret,
					code,
				}),
			},
		);

		const data = await tokenResponse.json();

		if (data.error) {
			return res
				.status(400)
				.json({ error: data.error_description || data.error });
		}

		// Return the access token to the client
		return res.status(200).json({ access_token: data.access_token });
	} catch (error) {
		console.error("OAuth error:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
