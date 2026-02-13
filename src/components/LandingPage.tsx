import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GitCommit, Target, TrendingUp } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { StandupPreview } from "./StandupPreview";

const GitHubIcon = ({ className }: { className?: string }) => (
	<svg
		role="img"
		aria-label="GitHub logo"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		fill="currentColor"
	>
		<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
	</svg>
);

export function LandingPage() {
	const handleGitHubLogin = () => {
		const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
		const redirectUri = `${import.meta.env.VITE_APP_URL}/auth/callback`;
		const scope = "repo read:user";

		window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
	};

	return (
		<div className="dark">
			<div className="min-h-screen transition-colors bg-surface">
				<main className="px-6 min-h-screen flex flex-col items-center justify-center py-20" role="main" aria-label="StandUp Tracker landing page">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="text-center max-w-4xl w-full"
					>
						<h1 className="text-6xl font-bold mb-6 text-foreground">
							Never forget what you did
							<span className="text-accent"> yesterday</span>
						</h1>

<p className="text-xl mb-8 leading-relaxed text-foreground-muted">
							StandUp Tracker automatically pulls your commits and helps
							you generate standup notes in seconds. Track progress toward
							goals and never stress about daily updates again.
						</p>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.6 }}
							className="mb-16"
						>
							<Button 
								size="lg" 
								className="text-lg px-8 py-6 bg-accent hover:bg-accent-strong text-foreground" 
								onClick={handleGitHubLogin}
								aria-label="Sign in with GitHub to get started"
							>
								<GitHubIcon className="mr-2 h-5 w-5" />
								Sign in with GitHub
							</Button>

						<p className="text-sm text-foreground-muted mt-4" aria-label="Features: Free, No credit card required, 2 minute setup">
								Free • No credit card required • 2 minute setup
							</p>
						</motion.div>
						<motion.section
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5, duration: 0.6 }}
							className="grid md:grid-cols-3 gap-4 mb-16 max-w-6xl mx-auto"
							aria-labelledby="features-heading"
						>
							<h2 id="features-heading" className="sr-only">Key Features</h2>
							<FeatureCard
								icon={<GitCommit className="h-7 w-7 text-accent" aria-hidden="true" />}
								title="Sync with Git"
								description="Your commits become your standup notes. One click to generate yesterday's update."
							/>

							<FeatureCard
								icon={<Target className="h-7 w-7 text-accent" aria-hidden="true" />}
								title="Link to SMART goals"
								description="Connect daily work to bigger objectives. See progress toward what matters."
							/>

							<FeatureCard
								icon={<TrendingUp className="h-7 w-7 text-accent" aria-hidden="true" />}
								title="Learn your velocity"
								description="Coming soon: 
								Predict story points based on your actual work patterns."
							/>
						</motion.section>
						<motion.section
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.7, duration: 0.6 }}
							aria-labelledby="preview-heading"
						>
							<h2 id="preview-heading" className="sr-only">Standup Note Preview</h2>
							<StandupPreview />
						</motion.section>
					</motion.div>
				</main>
			</div>
		</div>
	);
}
