import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../store";
import { Header } from "./Header";
import { Footer } from "./Footer";
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
import { Loader2, ArrowLeft, GitCommit, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import type { Standup } from "../types";

export function StandupDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { deleteStandup } = useStore();

	const [standup, setStandup] = useState<Standup | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

	const handleEdit = () => {
		navigate(`/standup/${id}/edit`);
	};

	const handleDelete = async () => {
		if (!id) return;

		setDeleting(true);
		try {
			await deleteStandup(id);
			setDeleteDialogOpen(false);
			navigate("/dashboard");
		} catch (err) {
			console.error("Failed to delete standup:", err);
			setDeleting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-surface">
				<Header />

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
				<div className="min-h-screen bg-surface">
				<Header />

				<main className="container mx-auto px-6 py-8 max-w-4xl">
					<Card className="p-8 bg-surface-raised/50 border-border text-center">
						<h2 className="text-2xl font-bold text-text mb-4">Standup Not Found</h2>
						<p className="text-text-subtle mb-6">{error || "This standup doesn't exist."}</p>
						<Link to="/dashboard">
							<Button className="bg-accent hover:bg-accent-strong text-text">
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
		<div className="min-h-screen bg-surface">
			<main className="container mx-auto px-6 py-8 max-w-4xl">
				{/* Breadcrumb and Actions */}
				<div className="mb-6 flex items-center justify-between">
					<Link to="/dashboard">
						<Button variant="ghost" size="sm" className="text-text-muted hover:text-text hover:bg-surface-raised">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Dashboard
						</Button>
					</Link>

					<div className="flex items-center gap-3">
						<Button variant="outline" size="sm" onClick={handleEdit} className="bg-surface-raised border-border hover:bg-surface-strong text-text-soft hover:text-text">
							<Edit className="h-4 w-4 mr-2" />
							Edit
						</Button>

						<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
							<AlertDialogTrigger asChild>
								<Button variant="outline" size="sm" className="bg-surface-raised border-border hover:bg-destructive-strong hover:border-destructive text-text-soft hover:text-text">
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Delete Standup Note?</AlertDialogTitle>
									<AlertDialogDescription>
										This will permanently delete this standup
										note from {format(new Date(standup.date), "MMMM d, yyyy")}. This action cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction onClick={handleDelete} disabled={deleting}>
										{deleting ? (
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
					<Card className="p-8 bg-surface-raised/50 border-border">
					<div className="mb-8">
							<h2 className="text-3xl font-bold text-text mb-2">
							{format(
								new Date(standup.date),
								"EEEE, MMMM d, yyyy",
							)}
						</h2>
							<div className="flex items-center gap-4 text-sm text-text-muted">
							<span>{standup.commits.length} commits</span>
							{standup.repoFullName && (
								<span>• {standup.repoFullName}</span>
							)}
						</div>
					</div>

					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-text mb-3">
								Work Completed
							</h3>
							<div className="text-text prose prose-invert prose-sm max-w-none">
								<ReactMarkdown>
									{standup.workCompleted}
								</ReactMarkdown>
							</div>

							{standup.commits.length > 0 && (
								<details className="mt-4">
									<summary className="text-sm text-accent cursor-pointer hover:text-accent-strong flex items-center gap-2">
										<GitCommit className="h-4 w-4" />
										View {standup.commits.length} commit
										{standup.commits.length !== 1
											? "s"
											: ""}
									</summary>
									<div className="mt-4 space-y-3 pl-4 border-l-2 border-border">
										{standup.commits.map((commit) => (
											<div
												key={commit.sha}
												className="text-sm"
											>
												<div className="flex items-start gap-2">
													<code className="text-accent font-mono">
														{commit.sha.substring(
															0,
															7,
														)}
													</code>
													<span className="text-text flex-1">
														{
															commit.commit.message.split(
																"\n",
															)[0]
														}
													</span>
												</div>
												{commit.commit.author && (
													<div className="text-text-muted mt-1 ml-[4.5rem]">
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
							<h3 className="text-lg font-semibold text-text mb-3">Work Planned</h3>
							<div className="text-text prose prose-invert prose-sm max-w-none">
								<ReactMarkdown>{standup.workPlanned}</ReactMarkdown>
							</div>
						</div>

						<div>
							<h3 className="text-lg font-semibold text-text mb-3">Blockers</h3>
							<div className="text-text prose prose-invert prose-sm max-w-none">
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
