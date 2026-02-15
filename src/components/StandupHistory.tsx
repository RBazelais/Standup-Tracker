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
			<Card className="p-8 bg-surface-raised border-border" role="status" aria-live="polite" aria-label="Loading standup notes">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
					<span className="sr-only">Loading standup notes...</span>
				</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="p-8 bg-surface-raised border-border text-center" role="alert" aria-live="assertive">
				<AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" aria-hidden="true" />
				<h3 className="text-lg font-semibold text-foreground mb-2">
					Failed to Load Standups
				</h3>
				<p className="text-foreground-muted">
					There was an error loading your standup history. Please try
					again.
				</p>
			</Card>
		);
	}

	if (standups.length === 0) {
		return (
			<Card className="p-8 bg-surface-raised border-border text-center" role="status">
				<GitCommit className="h-12 w-12 text-foreground-muted mx-auto mb-4" aria-hidden="true" />
				<h3 className="text-lg font-semibold text-foreground mb-2">
					No Standup Notes Yet
				</h3>
				<p className="text-foreground-muted">
					Create your first standup note above to get started!
				</p>
			</Card>
		);
	}

	return (
		<div className="space-y-4" role="region" aria-labelledby="history-heading">
			<div className="flex items-center justify-between mb-4">
				<h2 id="history-heading" className="text-xl font-semibold text-foreground flex items-center gap-2">
					<Calendar className="h-5 w-5 text-accent" aria-hidden="true" />
					Standup Note History
				</h2>
				<span className="text-sm text-foreground-muted" aria-live="polite" role="status">
					{standups.length} note{standups.length !== 1 ? "s" : ""}
				</span>
			</div>

			<div role="list" aria-label="Standup notes">
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
						role="listitem"
						aria-label={ariaLabel}
						className="p-4 bg-surface-raised border-border hover:bg-surface-overlay cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background gap-1.5 my-5 text-white"
					>
						<div className="flex items-start justify-between mb-3">
							<div>
								<h3 className="font-semibold text-foreground" aria-hidden="true">
									{formattedDate}
								</h3>
							<p className="text-xs text-foreground-muted mt-1 text-white" aria-hidden="true">
									{commitCount} commit
									{commitCount !== 1 ? "s" : ""}
								</p>
							</div>
							{hasBlockers && (
								<span className="px-2 py-1 text-xs bg-danger-subtle text-danger-text text-white rounded" aria-label="Has blockers">
									Blockers
								</span>
							)}
						</div>

						<div className="space-y-2 text-sm">
							<div>
							<span className="text-foreground-muted text-white">
									Completed:{" "}
								</span>
								<span className="text-foreground-muted line-clamp-2 text-white">
									{firstLineCompleted}
								</span>
							</div>
							<div>
								<span className="text-foreground-muted text-white">
									Planned:{" "}
								</span>
								<span className="text-foreground-muted line-clamp-2 text-white">
									{firstLinePlanned}
								</span>
							</div>
						</div>

						<div className="mt-3 pt-3 border-t border-border text-white">
							<p className="text-xs text-foreground-muted" aria-hidden="true">
								Click to view full details →
							</p>
						</div>
					</Card>
				);
			})}
		</div>
		</div>
	);
	
}
