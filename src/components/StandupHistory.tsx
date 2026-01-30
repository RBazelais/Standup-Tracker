import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, GitCommit } from "lucide-react";
import { format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";

export function StandupHistory() {
	const { standups, selectedRepo, deleteStandup } = useStore();
	const navigate = useNavigate();

	const repoStandups = standups
		.filter((s) => s.repoFullName === selectedRepo?.full_name)
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() -
				new Date(a.createdAt).getTime(),
		);

	if (repoStandups.length === 0) {
		return (
			<Card className="p-8 bg-slate-800/50 border-slate-700 text-center">
				<Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
				<p className="text-slate-400">
					No standups yet for this repository.
				</p>
				<p className="text-sm text-slate-500 mt-2">
					Create your first standup note above to get started.
				</p>
			</Card>
		);
	}

	return (
		<Card className="p-6 bg-slate-800/50 border-slate-700">
			<div className="flex items-center gap-3 mb-6">
				<Calendar className="h-5 w-5 text-blue-500" />
				<h2 className="text-lg font-semibold text-white">
					Standup Note History
				</h2>
				<span className="text-sm text-slate-500">
					({repoStandups.length})
				</span>
			</div>

			<div className="space-y-4">
				{repoStandups.map((standup) => (
					<Card
						key={standup.id}
						className="p-5 bg-slate-900/50 border-slate-700 hover:bg-slate-900/70 transition-colors cursor-pointer"
						onClick={() => navigate(`/standup/${standup.id}`)}
					>
						<div className="flex items-start justify-between mb-4">
							<div>
								<h3 className="text-white font-medium">
									{format(
										parseISO(standup.date),
										"EEEE, MMM d, yyyy",
									)}
								</h3>
								<p className="text-xs text-slate-500 mt-1">
									{standup.commits.length} commit
									{standup.commits.length !== 1 ? "s" : ""}
								</p>
							</div>
						</div>

						<div className="space-y-4 text-sm">
							{/* Yesterday with commits */}
							<div>
								<p className="text-slate-400 font-medium mb-2">
									Yesterday
								</p>
								<div className="text-slate-300 prose prose-invert prose-sm max-w-none">
									<ReactMarkdown>
										{standup.yesterday}
									</ReactMarkdown>
								</div>

								{standup.commits.length > 0 && (
									<details className="mt-3">
										<summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 flex items-center gap-1">
											<GitCommit className="h-3 w-3" />
											View {standup.commits.length} commit
											{standup.commits.length !== 1
												? "s"
												: ""}
										</summary>
										<div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-700">
											{standup.commits
												.slice(0, 10)
												.map((commit) => (
													<div key={commit.sha}className="text-xs">
														<div className="flex items-start gap-2">
															<code className="text-blue-400 font-mono">
																{commit.sha.substring(0,7,)}
															</code>
															<span className="text-slate-300 flex-1">
																{
																	commit.commit.message.split(
																		"\n",
																	)[0]
																}
															</span>
														</div>
														{commit.commit
															.author && (
															<div className="text-slate-500 mt-1 ml-[4.5rem]">
																{commit.commit.author.name || "Unknown"}
																{commit.commit.author.date && (
																	<>
																		{" "}•{" "}
																		{format(
																			new Date(commit.commit.author.date),
																			"MMM d, h:mm a",
																		)}
																	</>
																)}
															</div>
														)}
													</div>
												))}
											{standup.commits.length > 10 && (
												<p className="text-slate-500 text-xs ml-[4.5rem]">
													+{" "}
													{standup.commits.length -
														10}{" "}
													more commits
												</p>
											)}
										</div>
									</details>
								)}
							</div>

							{/* Today */}
							<div>
								<p className="text-slate-400 font-medium mb-2">
									Today
								</p>
								<div className="text-slate-300 prose prose-invert prose-sm max-w-none">
									<ReactMarkdown>
										{standup.today}
									</ReactMarkdown>
								</div>
							</div>

							{/* Blockers */}
							<div>
								<p className="text-slate-400 font-medium mb-2">
									Blockers
								</p>
								<div className="text-slate-300 prose prose-invert prose-sm max-w-none">
									<ReactMarkdown>
										{standup.blockers}
									</ReactMarkdown>
								</div>
							</div>
						</div>

						{standup.taskIds && standup.taskIds.length > 0 && (
							<div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
								{standup.taskIds.map((taskId) => (
									<span
										key={taskId}
										className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
									>
										Task linked
									</span>
								))}
							</div>
						)}
					</Card>
				))}
			</div>
		</Card>
	);
}
