import { useState, useEffect, useMemo } from "react";
import { useStore } from "../store";
import { useCommits } from "../hooks/useCommits";
import { useStandups } from "../hooks/useStandups";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, GitCommit, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { getToday, getYesterday } from "../utils/dateUtils";
import { filterCommitsByDateRange, buildAutoPopulateText } from "../utils/commitUtils";
import { DateRangePresets } from "./DateRangePresets";
import type { Preset } from "./DateRangePresets";
import { CommitPreviewer } from "./CommitPreviewer";
import { StandupFormFields } from "./StandupFormFields";
import type { GitHubCommit } from "@/types";
import { TaskLinkingSection } from "@/components/TaskLinking";


export function StandupForm() {
	const { selectedRepo, selectedBranch } = useStore();
	const { createStandup, isCreating } = useStandups();

	const [workCompleted, setWorkCompleted] = useState("");
	const [workPlanned, setWorkPlanned] = useState("");
	const [blockers, setBlockers] = useState("");
	const [saved, setSaved] = useState(false);
	const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([]);
	const [taskSectionKey, setTaskSectionKey] = useState(0);

	const [activePreset, setActivePreset] = useState<Preset | null>(null);
	const [commitStartDate, setCommitStartDate] = useState(getYesterday());
	const [commitEndDate, setCommitEndDate] = useState(getToday());

	const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
	const [oldestFirst, setOldestFirst] = useState(true);

	const { commits: rawCommits, loading: commitsLoading } = useCommits(
		commitStartDate,
		commitEndDate,
	);

	// Filter client-side to exact date range (handles timezone edge cases)
	const commits = useMemo(
		() => filterCommitsByDateRange(rawCommits, commitStartDate, commitEndDate),
		[rawCommits, commitStartDate, commitEndDate],
	);

	// Auto-select all commits when they load
	useEffect(() => {
		if (commits.length > 0) {
			const ids = new Set(commits.map((c) => c.sha));
			const t = setTimeout(() => setSelectedCommits(ids), 0);
			return () => clearTimeout(t);
		}
	}, [commits]);

	const handleRangeChange = (start: string, end: string, preset: Preset | null) => {
		setCommitStartDate(start);
		setCommitEndDate(end);
		setActivePreset(preset);
	};

	const toggleCommit = (sha: string) => {
		setSelectedCommits((prev) => {
			const next = new Set(prev);
			if (next.has(sha)) next.delete(sha);
			else next.add(sha);
			return next;
		});
	};

	const selectDay = (dayCommits: GitHubCommit[]) => {
		setSelectedCommits((prev) => {
			const next = new Set(prev);
			dayCommits.forEach((c) => next.add(c.sha));
			return next;
		});
	};

	const deselectDay = (dayCommits: GitHubCommit[]) => {
		setSelectedCommits((prev) => {
			const next = new Set(prev);
			dayCommits.forEach((c) => next.delete(c.sha));
			return next;
		});
	};

	const handleAutoPopulate = () => {
		const selected = commits.filter((c) => selectedCommits.has(c.sha));
		if (selected.length === 0) return;
		setWorkCompleted(buildAutoPopulateText(selected));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedRepo) return;

		const selectedCommitObjects = commits
			.filter((c) => selectedCommits.has(c.sha))
			.map((c) => ({ ...c, branch: selectedBranch || selectedRepo.default_branch }));

		createStandup(
			{
				date: getToday(),
				workCompleted,
				workPlanned,
				blockers: blockers || "None",
				taskIds: linkedTaskIds,
				commits: selectedCommitObjects,
				repoFullName: selectedRepo.full_name,
			},
			{
				onSuccess: () => {
					setSaved(true);
					setTimeout(() => {
						setWorkCompleted("");
						setWorkPlanned("");
						setBlockers("");
						setSelectedCommits(new Set());
						setLinkedTaskIds([]);
						setTaskSectionKey(k => k + 1);
						setSaved(false);
					}, 2000);
				},
			},
		);
	};

	if (!selectedRepo) {
		return (
			<Card className="p-8 bg-surface-raised border-border text-center">
				<p className="text-foreground-muted">
					Select a repository to create a standup note
				</p>
			</Card>
		);
	}

	return (
		<Card className="p-6 bg-surface-raised border-border">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<GitCommit className="h-5 w-5 text-accent" />
					<h2 className="text-lg font-semibold text-foreground">
						Create Standup note
					</h2>
				</div>
				<span className="text-sm text-foreground-muted">
					{format(new Date(), "EEEE, MMM d, yyyy")}
				</span>
			</div>

			<form
				onSubmit={handleSubmit}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
						e.preventDefault();
					}
				}}
				className="space-y-6"
			>
				<Card className="p-4 bg-surface-overlay border-border">
					<DateRangePresets
						startDate={commitStartDate}
						endDate={commitEndDate}
						activePreset={activePreset}
						onRangeChange={handleRangeChange}
					/>
					<div className="mt-3">
						<CommitPreviewer
							commits={commits}
							loading={commitsLoading}
							selectedCommits={selectedCommits}
							onToggleCommit={toggleCommit}
							onSelectDay={selectDay}
							onDeselectDay={deselectDay}
							onSelectAll={() => setSelectedCommits(new Set(commits.map((c) => c.sha)))}
							onDeselectAll={() => setSelectedCommits(new Set())}
							onAutoPopulate={handleAutoPopulate}
							oldestFirst={oldestFirst}
							onOldestFirstChange={setOldestFirst}
						/>
					</div>
				</Card>

				<StandupFormFields
					workCompleted={workCompleted}
					workPlanned={workPlanned}
					blockers={blockers}
					onWorkCompletedChange={setWorkCompleted}
					onWorkPlannedChange={setWorkPlanned}
					onBlockersChange={setBlockers}
				/>


				{/* Task Linking */}
				<TaskLinkingSection
					key={taskSectionKey}
					standup={{
						commits: commits,
						repoFullName: selectedRepo.full_name,
					}}
					onTasksChange={setLinkedTaskIds}
				/>

				{/* Submit */}
				<Button
					type="submit"
					disabled={isCreating || saved}
					className="w-full bg-accent hover:bg-accent-hover text-white"
				>
					{saved ? (
						<>
							<CheckCircle2 className="mr-2 h-4 w-4" />
							Saved!
						</>
					) : isCreating ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Saving...
						</>
					) : (
						"Save Standup Note"
					)}
				</Button>
			</form>
		</Card>
	);
}