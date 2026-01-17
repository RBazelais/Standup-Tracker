import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github, GitCommit, Target, TrendingUp } from "lucide-react";

export function LandingPage() {
	const handleGitHubLogin = () => {
		const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
		const redirectUri = `${import.meta.env.VITE_APP_URL}/auth/callback`;
		const scope = "repo read:user";

		window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
			{/* Hero Section */}
			<div className="container mx-auto px-6 pt-20 pb-16">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="text-center max-w-4xl mx-auto"
				>
					<h1 className="text-6xl font-bold text-slate-900 mb-6">
						Never forget what you did
						<span className="text-blue-600"> yesterday</span>
					</h1>

					<p className="text-xl text-slate-600 mb-8 leading-relaxed">
						StandUp automatically pulls your commits and helps you
						write standups in seconds. Track progress toward goals
						and never stress about daily updates again.
					</p>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3, duration: 0.6 }}
					>
						<Button
							size="lg"
							className="text-lg px-8 py-6 bg-slate-900 hover:bg-slate-800"
							onClick={handleGitHubLogin}
						>
							<Github className="mr-2 h-5 w-5" />
							Sign in with GitHub
						</Button>

						<p className="text-sm text-slate-500 mt-4">
							Free • No credit card required • 2 minute setup
						</p>
					</motion.div>
				</motion.div>

				{/* Feature Cards */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5, duration: 0.6 }}
					className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto"
				>
					<FeatureCard
						icon={<GitCommit className="h-8 w-8 text-blue-600" />}
						title="Auto-populate from Git"
						description="Your commits become your standup notes. One click to generate yesterday's update."
					/>

					<FeatureCard
						icon={<Target className="h-8 w-8 text-blue-600" />}
						title="Link to SMART goals"
						description="Connect daily work to bigger objectives. See progress toward what matters."
					/>

					<FeatureCard
						icon={<TrendingUp className="h-8 w-8 text-blue-600" />}
						title="Learn your velocity"
						description="Coming soon: Predict story points based on your actual work patterns."
					/>
				</motion.div>

				{/* Demo Preview */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.7, duration: 0.6 }}
					className="mt-20 max-w-4xl mx-auto"
				>
					<Card className="p-8 bg-white/80 backdrop-blur shadow-2xl border-slate-200">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold text-slate-900">
									Today's Standup
								</h3>
								<span className="text-sm text-slate-500">
									Jan 16, 2026
								</span>
							</div>

							<div className="space-y-3">
								<PreviewField
									label="Yesterday"
									content="Implemented GitHub OAuth flow • Fixed TypeScript types for nullable fields • Set up Zustand store"
								/>

								<PreviewField
									label="Today"
									content="Build landing page • Create standup form component • Integrate commit fetching"
								/>

								<PreviewField label="Blockers" content="None" />
							</div>

							<div className="flex gap-2 pt-2">
								<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
									🎯 Launch MVP
								</span>
								<span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
									🚀 Portfolio Project
								</span>
							</div>
						</div>
					</Card>
				</motion.div>
			</div>
		</div>
	);
}

interface FeatureCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
	return (
		<Card className="p-6 bg-white/60 backdrop-blur border-slate-200 hover:shadow-lg transition-shadow">
			<div className="mb-4">{icon}</div>
			<h3 className="text-lg font-semibold text-slate-900 mb-2">
				{title}
			</h3>
			<p className="text-slate-600 text-sm leading-relaxed">
				{description}
			</p>
		</Card>
	);
}

interface PreviewFieldProps {
	label: string;
	content: string;
}

function PreviewField({ label, content }: PreviewFieldProps) {
	return (
		<div>
			<label className="text-sm font-medium text-slate-700 mb-1 block">
				{label}
			</label>
			<p className="text-slate-600 text-sm">{content}</p>
		</div>
	);
}
