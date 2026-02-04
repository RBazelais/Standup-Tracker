import { useNavigate } from "react-router-dom";
import { useStandups } from "../hooks/useStandups";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar, GitCommit, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";


export function StandupHistory() {
	const navigate = useNavigate();
	const { standups, isLoading, error } = useStandups();

	if (isLoading) {
		return (
			<Card className="p-8 bg-surface-raised border-border">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-accent" />
				</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="p-8 bg-surface-raised border-border text-center">
				<AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
				<h3 className="text-lg font-semibold text-text mb-2">
					Failed to Load Standups
				</h3>
				<p className="text-text-subtle">
					There was an error loading your standup history. Please try
					again.
				</p>
			</Card>
		);
	}

	if (standups.length === 0) {
		return (
			<Card className="p-8 bg-surface-raised border-border text-center">
				<GitCommit className="h-12 w-12 text-text-muted mx-auto mb-4" />
				<h3 className="text-lg font-semibold text-text mb-2">
					No Standup Notes Yet
				</h3>
				<p className="text-text-subtle">
					Create your first standup note above to get started!
				</p>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold text-text flex items-center gap-2">
					<Calendar className="h-5 w-5 text-accent" />
					Standup Note History
				</h2>
				<span className="text-sm text-text-muted">
					{standups.length} note{standups.length !== 1 ? "s" : ""}
				</span>
			</div>

			{standups.map((standup) => {
				const firstLineCompleted = standup.workCompleted.split("\n")[0];
				const firstLinePlanned = standup.workPlanned.split("\n")[0];
				const hasBlockers =
					standup.blockers && standup.blockers !== "None";
				const formattedDate = format(parseISO(standup.date), "EEEE, MMMM d, yyyy");
				const commitCount = standup.commits.length;
				const ariaLabel = `Standup note from ${formattedDate}, ${commitCount} commit${commitCount !== 1 ? "s" : ""}${hasBlockers ? ", has blockers" : ""}. Press Enter to view details.`;

				return (
					<Card
						key={standup.id}
						onClick={() => navigate(`/standup/${standup.id}`)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								navigate(`/standup/${standup.id}`);
							}
						}}
						tabIndex={0}
						role="button"
						aria-label={ariaLabel}
						className="p-4 bg-surface-raised border-border hover:bg-surface-overlay cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
					>
						<div className="flex items-start justify-between mb-3">
							<div>
								<h3 className="font-semibold text-text" aria-hidden="true">
									{formattedDate}
								</h3>
								<p className="text-xs text-text-muted mt-1" aria-hidden="true">
									{commitCount} commit
									{commitCount !== 1 ? "s" : ""}
								</p>
							</div>
							{hasBlockers && (
								<span className="px-2 py-1 text-xs bg-danger-subtle text-danger-text rounded">
									Blockers
								</span>
							)}
						</div>

						<div className="space-y-2 text-sm">
							<div>
								<span className="text-text-muted">
									Completed:{" "}
								</span>
								<span className="text-text-soft line-clamp-1">
									{firstLineCompleted}
								</span>
							</div>
							<div>
								<span className="text-text-muted">
									Planned:{" "}
								</span>
								<span className="text-text-soft line-clamp-1">
									{firstLinePlanned}
								</span>
							</div>
						</div>

						<div className="mt-3 pt-3 border-t border-border">
							<p className="text-xs text-text-muted">
								Click to view full details →
							</p>
						</div>
					</Card>
				);
			})}
		</div>
	);
}
