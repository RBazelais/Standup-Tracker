import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { GitHubService } from "../services/github";

export function AuthCallback() {
	const [error, setError] = useState<string | null>(null);
	const [showError, setShowError] = useState(false);
	const navigate = useNavigate();
	const { setAccessToken, setUser } = useStore();

	useEffect(() => {
		let errorTimeout: NodeJS.Timeout | null = null;

		const handleCallback = async () => {
			const params = new URLSearchParams(window.location.search);
			const code = params.get("code");

			if (!code) {
				setError("No authorization code found");
				setShowError(true);
				return;
			}

			try {
				const response = await fetch("/api/auth/callback", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ code }),
				});

				if (!response.ok) {
					throw new Error("Failed to exchange code for token");
				}

				const { access_token } = await response.json();
				const github = new GitHubService(access_token);
				const user = await github.getUser();
				setAccessToken(access_token);
				setUser(user);
				await new Promise(resolve => setTimeout(resolve, 100));
				navigate("/dashboard");
			} catch (err) {
				console.error("Auth error:", err);
				setError(
					err instanceof Error
					? err.message
					: "Authentication failed",
				);
				// Only show error after 1s to avoid brief flash
				errorTimeout = setTimeout(() => setShowError(true), 1000);
			}
		};

		handleCallback();

		return () => {
			if (errorTimeout) clearTimeout(errorTimeout);
		};
	}, [navigate, setAccessToken, setUser]);

	if (error && showError) {
		return (
			<div className="min-h-screen bg-slate-950 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Authentication Error
					</h1>
					<p className="text-slate-400 mb-6">{error}</p>
					<a
						href="/"
						className="text-blue-500 hover:text-blue-400 transition-colors"
					>
						Return to home
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-950 flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p className="text-slate-400">Completing sign in...</p>
			</div>
		</div>
	);
}
