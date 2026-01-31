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

			<div className="space-y-3">
				{repoStandups.map((standup) => (
					<Card
						key={standup.id}
						className="p-4 bg-slate-900/50 border-slate-700 hover:bg-slate-900/70 hover:border-slate-600 transition-all cursor-pointer"
						onClick={() => navigate(`/standup/${standup.id}`)}
					>
						{/* Header */}
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-white font-medium">
								{format(
									new Date(standup.date),
									"EEE, MMM d, yyyy",
								)}
							</h3>
							<span className="text-xs text-slate-500">
								{standup.commits.length} commit
								{standup.commits.length !== 1 ? "s" : ""}
							</span>
						</div>

						{/* Summary */}
						<div className="space-y-2 text-sm">
							<div className="flex gap-2">
								<span className="text-slate-500 font-medium min-w-[70px]">
									Completed:
								</span>
								<p className="text-slate-300 line-clamp-1">
									{getFirstLine(standup.workCompleted)}
								</p>
							</div>

							<div className="flex gap-2">
								<span className="text-slate-500 font-medium min-w-[70px]">
									Planned:
								</span>
								<p className="text-slate-300 line-clamp-1">
									{getFirstLine(standup.workPlanned)}
								</p>
							</div>

							{standup.blockers !== "None" && (
								<div className="flex gap-2">
									<span className="text-slate-500 font-medium min-w-[70px]">
										Blockers:
									</span>
									<p className="text-red-300 line-clamp-1">
										{standup.blockers}
									</p>
								</div>
							)}
						</div>

						{/* Footer hint */}
						<div className="mt-3 pt-3 border-t border-slate-700/50">
							<p className="text-xs text-slate-500">
								Click to view full details →
							</p>
						</div>
					</Card>
				))}
			</div>
		</Card>
	);
}
