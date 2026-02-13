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
import { format, parseISO } from "date-fns";
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
						<div className="flex items-center justify-center py-20" role="status" aria-live="polite">
							<Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
							<span className="sr-only">Loading standup note...</span>
					</div>
				</main>
			</div>
		);
	}

	if (error || !standup) {
		return (
			<div className="min-h-screen bg-surface-base">
				<main className="container mx-auto px-6 py-8 max-w-4xl">
						<Card className="p-8 bg-surface-raised border-border text-center" role="alert">
						<h2 className="text-2xl font-bold text-foreground mb-4">
							Standup Not Found
						</h2>
						<p className="text-foreground-muted mb-6">
							{error ? "Failed to load standup" : "This standup doesn't exist."}
						</p>
						<Link to="/dashboard">
								<Button className="bg-accent hover:bg-accent-hover text-white" aria-label="Back to Dashboard">
									<ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
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
				<nav className="mb-6 flex items-center justify-between" aria-label="Standup navigation">
					<Link to="/dashboard">
						<Button
							variant="ghost"
							size="sm"
						className="text-foreground hover:text-foreground hover:bg-surface-raised"
						</Button>
					</Link>

					<div className="flex items-center gap-3" role="group" aria-label="Standup actions">
						<Button
							variant="outline"
							size="sm"
							onClick={handleEdit}
							className="bg-surface-raised border-border hover:bg-surface-overlay text-foreground-muted hover:text-foreground"
							aria-label="Edit standup note"
						>
							<Edit className="h-4 w-4 mr-2" aria-hidden="true" />
							Edit
						</Button>

						<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
							<AlertDialogTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="bg-surface-raised border-border hover:bg-danger-subtle hover:border-danger text-foreground-muted hover:text-danger-text"
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
										{format(parseISO(standup.date), "MMMM d, yyyy")}. This action
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
				</nav>

				{/* Standup Card */}
				<article>
					<Card className="p-8 bg-surface-raised border-border">
						<h1 className="sr-only">Standup Note</h1>
						<div className="mb-8">
							<h2 className="text-3xl font-bold text-foreground mb-2">
								{format(parseISO(standup.date), "EEEE, MMMM d, yyyy")}
							</h2>
						<div className="flex items-center gap-4 text-sm text-foreground-muted" role="contentinfo">
							<div className="flex items-center gap-2">
								<GitCommit className="h-4 w-4" aria-hidden="true" />
								<span>
									{standup.commits.length} commit
									{standup.commits.length !== 1 ? "s" : ""}
								</span>
							</div>
							{standup.repoFullName && (
								<span className="text-foreground-muted">
										from <code className="text-accent-text">{standup.repoFullName}</code>
									</span>
								)}
							</div>
						</div>

						<div className="space-y-6">
							{/* Work Completed */}
							<section aria-labelledby="work-completed-heading">
								<h3 id="work-completed-heading" className="text-lg font-semibold text-foreground mb-3">
									What you worked on
								</h3>
								<div className="prose prose-invert prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5" role="region" aria-label="Work completed details">
									<ReactMarkdown>{standup.workCompleted.replace(/\n/g, '  \n')}</ReactMarkdown>
								</div>
							</section>

							{/* Work Planned */}
							<section aria-labelledby="work-planned-heading">
								<h3 id="work-planned-heading" className="text-lg font-semibold text-foreground mb-3">
									What you'll work on next
								</h3>
								<div className="prose prose-invert prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5" role="region" aria-label="Work planned details">
									<ReactMarkdown>{standup.workPlanned.replace(/\n/g, '  \n')}</ReactMarkdown>
								</div>
							</section>

							{/* Blockers */}
							<section aria-labelledby="blockers-heading">
								<h3 id="blockers-heading" className="text-lg font-semibold text-foreground mb-3">Blockers</h3>
								<div className="prose prose-invert prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5" role="region" aria-label="Blockers details">
									<ReactMarkdown>{standup.blockers.replace(/\n/g, '  \n')}</ReactMarkdown>
								</div>
							</section>

							{/* Commits Accordion */}
							{standup.commits.length > 0 && (
								<section className="pt-6 border-t border-border" aria-labelledby="commits-heading">
									{(() => {
										// Check if commits come from multiple branches
										const branches = new Set(standup.commits.map(c => c.branch).filter(Boolean));
										const showBranches = branches.size > 1;
										
										return (
											<>
												<h3 id="commits-heading" className="text-lg font-semibold text-foreground mb-3">
													Commits ({standup.commits.length})
												</h3>
												<Accordion type="single" collapsible className="w-full">
													<AccordionItem value="commits">
														<AccordionTrigger className="hover:no-underline">
															<span className="text-sm text-foreground-muted">
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
																				<p className="text-sm text-foreground-muted">
																					{commit.commit.message.split("\n")[0]}
																				</p>
																				<div className="flex items-center gap-3 mt-1 flex-wrap">
																					<code className="text-xs text-accent-text font-mono">
																						{commit.sha.substring(0, 7)}
																					</code>
																					{showBranches && commit.branch && (
																					<span className="text-xs text-foreground-muted bg-surface-raised px-1.5 py-0.5 rounded">
																							{commit.branch}
																						</span>
																					)}
																					{commit.commit.author?.name && (
																					<span className="text-xs text-foreground-muted">
																							by {commit.commit.author.name}
																						</span>
																					)}
																					{commit.commit.author?.date && (
																					<span className="text-xs text-foreground-muted">
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
																					aria-label={`View commit ${commit.sha.substring(0, 7)} on GitHub`}
																				>
																					<ExternalLink className="h-4 w-4" aria-hidden="true" />
																				</a>
																			)}
																		</div>
																	</div>
																))}
															</div>
														</AccordionContent>
													</AccordionItem>
												</Accordion>
											</>
										);
									})()}
								</section>
							)}
						</div>
					</Card>
				</article>
			</main>
		</div>
	);
}