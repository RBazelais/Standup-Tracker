import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

export function StandupHistory() {
	const { standups, selectedRepo } = useStore();
	const navigate = useNavigate();

	const repoStandups = standups
		.filter((s) => s.repoFullName === selectedRepo?.full_name)
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() -
				new Date(a.createdAt).getTime(),
		);

	// Helper to get first line/bullet from text
	const getFirstLine = (text: string) => {
		const lines = text.split("\n").filter((line) => line.trim());
		return lines[0] || text.substring(0, 100);
	};

	if (repoStandups.length === 0) {
		return (
			<Card className="p-8 bg-surface-raised border-border text-center">
				<Calendar className="h-12 w-12 text-text-muted mx-auto mb-4" />
				<p className="text-text-subtle">
					No standups yet for this repository.
				</p>
				<p className="text-sm text-text-muted mt-2">
					Create your first standup note above to get started.
				</p>
			</Card>
		);
	}

	return (
		<Card className="p-6 bg-surface-raised border-border">
			<div className="flex items-center gap-3 mb-6">
				<Calendar className="h-5 w-5 text-accent" />
				<h2 className="text-lg font-semibold text-text">
					Standup Note History
				</h2>
				<span className="text-sm text-text-muted">({repoStandups.length})</span>
			</div>

			<div className="space-y-3">
				{repoStandups.map((standup) => (
					<Card
						key={standup.id}
						className="p-4 bg-surface-raised border-border hover:bg-surface-raised hover:border-border-strong transition-all cursor-pointer"
						onClick={() => navigate(`/standup/${standup.id}`)}
					>
						{/* Header */}
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-text font-medium">
								{format(new Date(standup.date), "EEE, MMM d, yyyy")}
							</h3>
							<span className="text-xs text-text-muted">
								{standup.commits.length} commit
								{standup.commits.length !== 1 ? "s" : ""}
							</span>
						</div>

						{/* Summary */}
						<div className="space-y-2 text-sm">
							<div className="flex gap-2">
								<span className="text-text-muted font-medium min-w-[70px]">
									Completed:
								</span>
								<p className="text-text-soft line-clamp-1">
									{getFirstLine(standup.workCompleted)}
								</p>
							</div>

							<div className="flex gap-2">
								<span className="text-text-muted font-medium min-w-[70px]">
									Planned:
								</span>
								<p className="text-text-soft line-clamp-1">
									{getFirstLine(standup.workPlanned)}
								</p>
							</div>

							{standup.blockers !== "None" && (
								<div className="flex gap-2">
									<span className="text-text-muted font-medium min-w-[70px]">
										Blockers:
									</span>
									<p className="text-danger-text line-clamp-1">
										{standup.blockers}
									</p>
								</div>
							)}
						</div>

						{/* Footer hint */}
						<div className="mt-3 pt-3 border-t border-border-subtle">
							<p className="text-xs text-text-muted">Click to view full details →</p>
						</div>
					</Card>
				))}
			</div>
		</Card>
	);
}
