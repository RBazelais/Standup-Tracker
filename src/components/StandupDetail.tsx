import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, GitCommit } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import type { Standup } from "../types";

export function StandupDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user, logout } = useStore();

	const [standup, setStandup] = useState<Standup | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStandup = async () => {
			if (!id) {
				setError("No standup ID provided");
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`/api/standups/${id}`);

				if (response.ok) {
					const data = await response.json();
					setStandup(data);
				} else if (response.status === 404) {
					setError("Standup not found");
				} else {
					setError("Failed to load standup");
				}
			} catch (err) {
				console.error("Error fetching standup:", err);
				setError("Failed to load standup");
			} finally {
				setLoading(false);
			}
		};

		fetchStandup();
	}, [id]);

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
				<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
					<div className="container mx-auto px-6 py-4 flex items-center justify-between">
						<h1 className="text-xl font-bold text-white">
							StandUp Tracker
						</h1>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-3">
								<img
									src={user?.avatar_url}
									alt={user?.name}
									className="h-8 w-8 rounded-full"
								/>
								<span className="text-sm text-slate-300">
									{user?.name}
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleLogout}
								className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300"
							>
								Logout
							</Button>
						</div>
					</div>
				</header>

				<main className="container mx-auto px-6 py-8 max-w-4xl">
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
					</div>
				</main>
			</div>
		);
	}

	if (error || !standup) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
				<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
					<div className="container mx-auto px-6 py-4 flex items-center justify-between">
						<h1 className="text-xl font-bold text-white">
							StandUp Tracker
						</h1>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-3">
								<img
									src={user?.avatar_url}
									alt={user?.name}
									className="h-8 w-8 rounded-full"
								/>
								<span className="text-sm text-slate-300">
									{user?.name}
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleLogout}
								className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300"
							>
								Logout
							</Button>
						</div>
					</div>
				</header>

				<main className="container mx-auto px-6 py-8 max-w-4xl">
					<Card className="p-8 bg-slate-800/50 border-slate-700 text-center">
						<h2 className="text-2xl font-bold text-white mb-4">
							Standup Not Found
						</h2>
						<p className="text-slate-400 mb-6">
							{error || "This standup doesn't exist."}
						</p>
						<Link to="/dashboard">
							<Button className="bg-blue-600 hover:bg-blue-700 text-white">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Dashboard
							</Button>
						</Link>
					</Card>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
			<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
				<div className="container mx-auto px-6 py-4 flex items-center justify-between">
					<h1 className="text-xl font-bold text-white">
						StandUp Tracker
					</h1>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-3">
							<img
								src={user?.avatar_url}
								alt={user?.name}
								className="h-8 w-8 rounded-full"
							/>
							<span className="text-sm text-slate-300">
								{user?.name}
							</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleLogout}
							className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300"
						>
							Logout
						</Button>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8 max-w-4xl">
				<div className="mb-6">
					<Link to="/dashboard">
						<Button
							variant="ghost"
							size="sm"
							className="text-slate-400 hover:text-white hover:bg-slate-800"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Dashboard
						</Button>
					</Link>
				</div>

				<Card className="p-8 bg-slate-800/50 border-slate-700">
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-white mb-2">
							{format(
								new Date(standup.date),
								"EEEE, MMMM d, yyyy",
							)}
						</h2>
						<div className="flex items-center gap-4 text-sm text-slate-400">
							<span>{standup.commits.length} commits</span>
							{standup.repoFullName && (
								<span>• {standup.repoFullName}</span>
							)}
						</div>
					</div>

					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-slate-300 mb-3">
								Yesterday
							</h3>
							<div className="text-slate-300 prose prose-invert prose-sm max-w-none">
								<ReactMarkdown>
									{standup.yesterday}
								</ReactMarkdown>
							</div>

							{standup.commits.length > 0 && (
								<details className="mt-4">
									<summary className="text-sm text-blue-400 cursor-pointer hover:text-blue-300 flex items-center gap-2">
										<GitCommit className="h-4 w-4" />
										View {standup.commits.length} commit
										{standup.commits.length !== 1
											? "s"
											: ""}
									</summary>
									<div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-700">
										{standup.commits.map((commit) => (
											<div
												key={commit.sha}
												className="text-sm"
											>
												<div className="flex items-start gap-2">
													<code className="text-blue-400 font-mono">
														{commit.sha.substring(
															0,
															7,
														)}
													</code>
													<span className="text-slate-300 flex-1">
														{
															commit.commit.message.split(
																"\n",
															)[0]
														}
													</span>
												</div>
												{commit.commit.author && (
													<div className="text-slate-500 mt-1 ml-[4.5rem]">
														{commit.commit.author
															.name ||
															"Unknown"}{" "}
														•{" "}
														{format(
															new Date(
																commit.commit
																	.author
																	.date ||
																	new Date(),
															),
															"MMM d, h:mm a",
														)}
													</div>
												)}
											</div>
										))}
									</div>
								</details>
							)}
						</div>

						<div>
							<h3 className="text-lg font-semibold text-slate-300 mb-3">
								Today
							</h3>
							<div className="text-slate-300 prose prose-invert prose-sm max-w-none">
								<ReactMarkdown>{standup.today}</ReactMarkdown>
							</div>
						</div>

						<div>
							<h3 className="text-lg font-semibold text-slate-300 mb-3">
								Blockers
							</h3>
							<div className="text-slate-300 prose prose-invert prose-sm max-w-none">
								<ReactMarkdown>
									{standup.blockers}
								</ReactMarkdown>
							</div>
						</div>
					</div>
				</Card>
			</main>
		</div>
	);
}
