import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useStandups } from "../hooks/useStandups";
import { standupsApi } from "../services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, ArrowLeft, GitCommit, Edit, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export function StandupDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { deleteStandup, isDeleting } = useStandups();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Fetch standup data
	const {
		data: standup,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["standup", id],
		queryFn: () => standupsApi.getById(id!),
		enabled: !!id,
	});

	const handleEdit = () => {
		navigate(`/standup/${id}/edit`);
	};

	const handleDelete = () => {
		if (!id) return;

		deleteStandup(id, {
			onSuccess: () => {
				setDeleteDialogOpen(false);
				navigate("/dashboard");
			},
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-surface-base">
				<main className="container mx-auto px-6 py-8 max-w-4xl">
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-accent" />
					</div>
				</main>
			</div>
		);
	}

	if (error || !standup) {
		return (
			<div className="min-h-screen bg-surface-base">
				<main className="container mx-auto px-6 py-8 max-w-4xl">
					<Card className="p-8 bg-surface-raised border-border text-center">
						<h2 className="text-2xl font-bold text-text mb-4">
							Standup Not Found
						</h2>
						<p className="text-text-subtle mb-6">
							{error ? "Failed to load standup" : "This standup doesn't exist."}
						</p>
						<Link to="/dashboard">
							<Button className="bg-accent hover:bg-accent-hover text-white">
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
		<div className="min-h-screen bg-surface-base">
			<main className="container mx-auto px-6 py-8 max-w-4xl">
				{/* Breadcrumb and Actions */}
				<div className="mb-6 flex items-center justify-between">
					<Link to="/dashboard">
						<Button
							variant="ghost"
							size="sm"
							className="text-text-muted hover:text-text hover:bg-surface-raised"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Dashboard
						</Button>
					</Link>

					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={handleEdit}
							className="bg-surface-raised border-border hover:bg-surface-overlay text-text-soft hover:text-text"
						>
							<Edit className="h-4 w-4 mr-2" />
							Edit
						</Button>

						<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
							<AlertDialogTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="bg-surface-raised border-border hover:bg-danger-subtle hover:border-danger text-text-soft hover:text-danger-text"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Delete Standup Note?</AlertDialogTitle>
									<AlertDialogDescription>
										This will permanently delete this standup note from{" "}
										{format(new Date(standup.date), "MMMM d, yyyy")}. This action
										cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDelete}
										disabled={isDeleting}
										className="bg-danger hover:bg-danger/90 text-white"
									>
										{isDeleting ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Deleting...
											</>
										) : (
											"Delete"
										)}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>

				{/* Standup Card */}
				<Card className="p-8 bg-surface-raised border-border">
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-text mb-2">
							{format(new Date(standup.date), "EEEE, MMMM d, yyyy")}
						</h2>
						<div className="flex items-center gap-4 text-sm text-text-muted">
							<div className="flex items-center gap-2">
								<GitCommit className="h-4 w-4" />
								<span>
									{standup.commits.length} commit
									{standup.commits.length !== 1 ? "s" : ""}
								</span>
							</div>
							{standup.repoFullName && (
								<span className="text-text-subtle">
									from <code className="text-accent-text">{standup.repoFullName}</code>
								</span>
							)}
						</div>
					</div>

					<div className="space-y-6">
						{/* Work Completed */}
						<div>
							<h3 className="text-lg font-semibold text-text mb-3">
								What you worked on
							</h3>
							<div className="prose prose-invert prose-sm max-w-none">
								<ReactMarkdown>{standup.workCompleted}</ReactMarkdown>
							</div>
						</div>

						{/* Work Planned */}
						<div>
							<h3 className="text-lg font-semibold text-text mb-3">
								What you'll work on next
							</h3>
							<div className="prose prose-invert prose-sm max-w-none">
								<ReactMarkdown>{standup.workPlanned}</ReactMarkdown>
							</div>
						</div>

						{/* Blockers */}
						<div>
							<h3 className="text-lg font-semibold text-text mb-3">Blockers</h3>
							<div className="prose prose-invert prose-sm max-w-none">
								<ReactMarkdown>{standup.blockers}</ReactMarkdown>
							</div>
						</div>

						{/* Commits Accordion */}
						{standup.commits.length > 0 && (
							<div className="pt-6 border-t border-border">
								<h3 className="text-lg font-semibold text-text mb-3">
									Commits ({standup.commits.length})
								</h3>
								<Accordion type="single" collapsible className="w-full">
									<AccordionItem value="commits">
										<AccordionTrigger className="hover:no-underline">
											<span className="text-sm text-text-soft">
												View all commits
											</span>
										</AccordionTrigger>
										<AccordionContent>
											<div className="space-y-2">
												{standup.commits.map((commit) => (
													<div
														key={commit.sha}
														className="p-3 bg-surface-overlay rounded-md border border-border"
													>
														<div className="flex items-start justify-between gap-3">
															<div className="flex-1 min-w-0">
																<p className="text-sm text-text-soft">
																	{commit.commit.message.split("\n")[0]}
																</p>
																<div className="flex items-center gap-3 mt-1">
																	<code className="text-xs text-accent-text font-mono">
																		{commit.sha.substring(0, 7)}
																	</code>
																	{commit.commit.author?.name && (
																		<span className="text-xs text-text-muted">
																			by {commit.commit.author.name}
																		</span>
																	)}
																	{commit.commit.author?.date && (
																		<span className="text-xs text-text-muted">
																			{format(
																				new Date(commit.commit.author.date),
																				"MMM d, h:mm a"
																			)}
																		</span>
																	)}
																</div>
															</div>
															{standup.repoFullName && (
																<a
																	href={`https://github.com/${standup.repoFullName}/commit/${commit.sha}`}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-accent-text hover:text-accent-active"
																>
																	<ExternalLink className="h-4 w-4" />
																</a>
															)}
														</div>
													</div>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</div>
						)}
					</div>
				</Card>
			</main>
		</div>
	);
}