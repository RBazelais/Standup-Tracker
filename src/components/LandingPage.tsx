import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Github, GitCommit, Target, TrendingUp, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { FeatureCard } from "./FeatureCard";
import { StandupPreview } from "./StandupPreview";

export function LandingPage() {
	const [isDark, setIsDark] = useState(true);

	const handleGitHubLogin = () => {
		const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
		const redirectUri = `${import.meta.env.VITE_APP_URL}/auth/callback`;
		const scope = "repo read:user";

		window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
	};

	return (
		<div className={isDark ? "dark" : ""}>
			<div
				className={`min-h-screen transition-colors ${
					isDark
						? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
						: "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100"
				}`}
			>
				{/* Theme Toggle */}
				<div className="absolute top-6 right-6 z-10">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setIsDark(!isDark)}
						className={
							isDark
								? "bg-slate-800/80 border-slate-700 hover:bg-slate-700"
								: "bg-white border-slate-300 hover:bg-slate-100"
						}
					>
						{isDark ? (
							<Sun className="h-5 w-5 text-yellow-400" />
						) : (
							<Moon className="h-5 w-5 text-slate-900" />
						)}
					</Button>
				</div>

				{/* Hero Section */}
				<div className="px-6 min-h-screen flex flex-col items-center justify-center py-20">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="text-center max-w-4xl w-full"
					>
						<h1
							className={`text-6xl font-bold mb-6 ${
								isDark ? "text-white" : "text-slate-900"
							}`}
						>
							Never forget what you did
							<span className="text-blue-500"> yesterday</span>
						</h1>

						<p
							className={`text-xl mb-8 leading-relaxed ${
								isDark ? "text-slate-400" : "text-slate-600"
							}`}
						>
							StandUp automatically pulls your commits and helps
							you write standups in seconds. Track progress toward
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
								className={`text-lg px-8 py-6 ${
									isDark
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: "bg-slate-900 hover:bg-slate-800 text-white"
								}`}
								onClick={handleGitHubLogin}
							>
								<Github className="mr-2 h-5 w-5" />
								Sign in with GitHub
							</Button>

							<p className="text-sm text-slate-500 mt-4">
								Free • No credit card required • 2 minute setup
							</p>
						</motion.div>

						{/* Feature Cards */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5, duration: 0.6 }}
							className="grid md:grid-cols-3 gap-4 mb-16 max-w-6xl mx-auto"
						>
							<FeatureCard
								isDark={isDark}
								icon={
									<GitCommit className="h-7 w-7 text-blue-500" />
								}
								title="Auto-populate from Git"
								description="Your commits become your standup notes. One click to generate yesterday's update."
							/>

							<FeatureCard
								isDark={isDark}
								icon={
									<Target className="h-7 w-7 text-blue-500" />
								}
								title="Link to SMART goals"
								description="Connect daily work to bigger objectives. See progress toward what matters."
							/>

							<FeatureCard
								isDark={isDark}
								icon={
									<TrendingUp className="h-7 w-7 text-blue-500" />
								}
								title="Learn your velocity"
								description="Coming soon: Predict story points based on your actual work patterns."
							/>
						</motion.div>

						{/* Demo Preview */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.7, duration: 0.6 }}
						>
							<StandupPreview isDark={isDark} />
						</motion.div>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
