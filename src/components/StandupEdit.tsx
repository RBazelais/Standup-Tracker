import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useStandups } from "../hooks/useStandups";
import { standupsApi } from "../services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Save, X } from "lucide-react";

export function StandupEdit() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { updateStandup, isUpdating } = useStandups();

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

	// Initialize form state from query data
	const [workCompleted, setWorkCompleted] = useState(
		standup?.workCompleted || "",
	);
	const [workPlanned, setWorkPlanned] = useState(standup?.workPlanned || "");
	const [blockers, setBlockers] = useState(standup?.blockers || "");

	// Hydrate form only once when data arrives
	if (standup && !workCompleted && !workPlanned && !blockers) {
		setWorkCompleted(standup.workCompleted);
		setWorkPlanned(standup.workPlanned);
		setBlockers(standup.blockers);
	}

	const handleCancel = () => {
		navigate(`/standup/${id}`);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!id) return;

		updateStandup(
			{
				id,
				updates: {
					workCompleted,
					workPlanned,
					blockers,
				},
			},
			{
				onSuccess: () => {
					navigate(`/standup/${id}`);
				},
			},
		);
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
							{error
								? "Failed to load standup"
								: "This standup doesn't exist."}
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
				{/* Breadcrumb */}
				<div className="mb-6">
					<Link to={`/standup/${id}`}>
						<Button
							variant="ghost"
							size="sm"
							className="text-text-muted hover:text-text hover:bg-surface-raised"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Standup
						</Button>
					</Link>
				</div>

				{/* Edit Form */}
				<Card className="p-8 bg-surface-raised border-border">
					<h2 className="text-2xl font-bold text-text mb-6">
						Edit Standup
					</h2>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Work Completed */}
						<div className="space-y-2">
							<Label
								htmlFor="workCompleted"
								className="text-text-soft"
							>
								What you worked on
							</Label>
							<Textarea
								id="workCompleted"
								value={workCompleted}
								onChange={(e) =>
									setWorkCompleted(e.target.value)
								}
								placeholder="What did you work on?"
								className="bg-surface-overlay border-border text-text placeholder:text-text-muted min-h-[120px]"
								required
							/>
						</div>

						{/* Work Planned */}
						<div className="space-y-2">
							<Label
								htmlFor="workPlanned"
								className="text-text-soft"
							>
								What you'll work on next
							</Label>
							<Textarea
								id="workPlanned"
								value={workPlanned}
								onChange={(e) => setWorkPlanned(e.target.value)}
								placeholder="What will you work on next?"
								className="bg-surface-overlay border-border text-text placeholder:text-text-muted min-h-[120px]"
								required
							/>
						</div>

						{/* Blockers */}
						<div className="space-y-2">
							<Label
								htmlFor="blockers"
								className="text-text-soft"
							>
								Blockers
							</Label>
							<Textarea
								id="blockers"
								value={blockers}
								onChange={(e) => setBlockers(e.target.value)}
								placeholder="Any blockers?"
								className="bg-surface-overlay border-border text-text placeholder:text-text-muted min-h-[100px]"
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 pt-4">
							<Button
								type="submit"
								disabled={isUpdating}
								className="flex-1 bg-accent hover:bg-accent-hover text-white"
							>
								{isUpdating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={isUpdating}
								className="bg-surface-raised border-border hover:bg-surface-overlay text-text-soft hover:text-text"
							>
								<X className="mr-2 h-4 w-4" />
								Cancel
							</Button>
						</div>
					</form>
				</Card>
			</main>
		</div>
	);
}
