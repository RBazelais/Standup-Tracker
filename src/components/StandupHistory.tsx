import { useStore } from "../store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export function StandupHistory() {
	const { standups, selectedRepo, deleteStandup } = useStore();

	// Filter standups for selected repo and sort by date (newest first)
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
					No standup notes yet for this repository.
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
					Standup History
				</h2>
				<span className="text-sm text-slate-500">
					({repoStandups.length})
				</span>
			</div>

			<div className="space-y-4">
				{repoStandups.map((standup) => (
					<Card
						key={standup.id}
						className="p-5 bg-slate-900/50 border-slate-700 hover:bg-slate-900/70 transition-colors"
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
							<Button
								variant="ghost"
								size="sm"
								onClick={() => deleteStandup(standup.id)}
								className="text-slate-400 hover:text-red-400 hover:bg-slate-800"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>

						<div className="space-y-3 text-sm">
							<div>
								<p className="text-slate-400 font-medium mb-1">
									Yesterday
								</p>
								<p className="text-slate-300">
									{standup.yesterday}
								</p>
							</div>

							<div>
								<p className="text-slate-400 font-medium mb-1">
									Today
								</p>
								<p className="text-slate-300">
									{standup.today}
								</p>
							</div>

							<div>
								<p className="text-slate-400 font-medium mb-1">
									Blockers
								</p>
								<p className="text-slate-300">
									{standup.blockers}
								</p>
							</div>
						</div>

						{standup.goalIds.length > 0 && (
							<div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
								{standup.goalIds.map((goalId) => (
									<span
										key={goalId}
										className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
									>
										Goal linked
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
