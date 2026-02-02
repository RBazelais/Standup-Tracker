import { useState } from "react";
import { useStore } from "../store";
import { useCommits } from "../hooks/useCommits";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, GitCommit, CheckCircle2, Calendar } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

export function StandupForm() {
	const { selectedRepo, addStandup } = useStore();

	const [workCompleted, setWorkCompleted] = useState("");
	const [workPlanned, setWorkPlanned] = useState("");
	const [blockers, setBlockers] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	// Date range for fetching commits
	const [commitStartDate, setCommitStartDate] = useState(
		format(subDays(new Date(), 1), "yyyy-MM-dd"),
	);
	const [commitEndDate, setCommitEndDate] = useState(
		format(new Date(), "yyyy-MM-dd"),
	);

	const {
		commits,
		loading: commitsLoading,
		refetchCommits,
	} = useCommits(commitStartDate, commitEndDate);

	// Preset date range functions
	const setYesterdayRange = () => {
		const yesterday = subDays(new Date(), 1);
		setCommitStartDate(format(yesterday, "yyyy-MM-dd"));
		setCommitEndDate(format(new Date(), "yyyy-MM-dd"));
	};

	const setLastFridayRange = () => {
		const today = new Date();
		const dayOfWeek = today.getDay();
		// If today is Monday (1), go back 3 days. If Sunday (0), go back 2 days.
		const daysToLastFriday = dayOfWeek === 0 ? 2 : dayOfWeek === 1 ? 3 : 1;
		const lastFriday = subDays(today, daysToLastFriday);
		setCommitStartDate(format(lastFriday, "yyyy-MM-dd"));
		setCommitEndDate(format(today, "yyyy-MM-dd"));
	};

	const setLastWeekRange = () => {
		const lastWeekStart = startOfWeek(subDays(new Date(), 7), {
			weekStartsOn: 1,
		}); // Monday
		const lastWeekEnd = endOfWeek(subDays(new Date(), 7), {
			weekStartsOn: 1,
		}); // Sunday
		setCommitStartDate(format(lastWeekStart, "yyyy-MM-dd"));
		setCommitEndDate(format(lastWeekEnd, "yyyy-MM-dd"));
	};

	const setThisWeekRange = () => {
		const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
		setCommitStartDate(format(weekStart, "yyyy-MM-dd"));
		setCommitEndDate(format(new Date(), "yyyy-MM-dd"));
	};

	const handleAutoPopulate = () => {
		if (commits.length === 0) return;

		const commitMessages = commits
			.map((commit) => {
				const message = commit.commit.message.split("\n")[0];
				const sha = commit.sha.substring(0, 7);
				return `- ${message} (\`${sha}\`)`;
			})
			.join("\n");

		setWorkCompleted(commitMessages);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedRepo) return;

		setSaving(true);

		const standup = {
			id: crypto.randomUUID(),
			date: format(new Date(), "yyyy-MM-dd"),
			workCompleted,
			workPlanned,
			blockers: blockers || "None",
			taskIds: [],
			commits,
			repoFullName: selectedRepo.full_name,
			createdAt: new Date().toISOString(),
		};

		await addStandup(standup);

		setSaving(false);
		setSaved(true);

		setTimeout(() => {
			setWorkCompleted("");
			setWorkPlanned("");
			setBlockers("");
			setSaved(false);
		}, 2000);
	};

	if (!selectedRepo) {
		return (
			<Card className="p-8 bg-surface-raised border-border text-center">
				<p className="text-text-subtle">
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
					<h2 className="text-lg font-semibold text-text">
						Create Standup note
					</h2>
				</div>

				<span className="text-sm text-text-muted">
					{format(new Date(), "EEEE, MMM d, yyyy")}
				</span>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Date Range Selector */}
				<Card className="p-4 bg-surface-raised border-border">
					<div className="flex items-center gap-2 mb-3">
						<Calendar className="h-4 w-4 text-text-muted" />
						<Label className="text-text-soft text-sm">
							Fetch commits from:
						</Label>
					</div>

					{/* Quick Presets */}
					<div className="flex flex-wrap gap-2 mb-3">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={setYesterdayRange}
							className="text-xs bg-surface-raised border-border hover:bg-surface-strong text-text-soft"
						>
							Yesterday
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={setLastFridayRange}
							className="text-xs bg-surface-raised border-border hover:bg-surface-strong text-text-soft"
						>
							Last Friday
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={setThisWeekRange}
							className="text-xs bg-surface-raised border-border hover:bg-surface-strong text-text-soft"
						>
							This Week
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={setLastWeekRange}
							className="text-xs bg-surface-raised border-border hover:bg-surface-strong text-text-soft"
						>
							Last Week
						</Button>
					</div>

					{/* Custom Date Inputs */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label
								htmlFor="start-date"
								className="text-xs text-text-muted"
							>
								Start Date
							</Label>
							<Input
								id="start-date"
								type="date"
								value={commitStartDate}
								onChange={(e) =>
									setCommitStartDate(e.target.value)
								}
								className="bg-surface-raised border-border text-text text-sm"
							/>
						</div>

						<div className="space-y-1">
							<Label
								htmlFor="end-date"
								className="text-xs text-text-muted"
							>
								End Date
							</Label>
							<Input
								id="end-date"
								type="date"
								value={commitEndDate}
								onChange={(e) =>
									setCommitEndDate(e.target.value)
								}
								max={format(new Date(), "yyyy-MM-dd")}
								className="bg-surface-raised border-border text-text text-sm"
							/>
						</div>
					</div>

					<div className="flex items-center justify-between mt-3">
						<span className="text-xs text-text-muted">
							{commits.length} commit
							{commits.length !== 1 ? "s" : ""} found
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={refetchCommits}
							disabled={commitsLoading}
							className="text-accent hover:text-accent-weak hover:bg-surface-raised text-xs"
						>
							{commitsLoading ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								"Refresh"
							)}
						</Button>
					</div>
				</Card>

				{/* Work Completed */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="workCompleted" className="text-text-soft">
							What you worked on
						</Label>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleAutoPopulate}
							disabled={commitsLoading || commits.length === 0}
							className="text-accent hover:text-accent-strong hover:bg-surface-raised"
						>
							{commitsLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<>Auto-populate ({commits.length})</>
							)}
						</Button>
					</div>
					<Textarea
						id="workCompleted"
						value={workCompleted}
						onChange={(e) => setWorkCompleted(e.target.value)}
						placeholder="What did you work on during this period?"
						className="bg-surface-muted border-border-subtle text-text placeholder:text-text-soft min-h-[100px] focus:bg-surface-strong"
						required
					/>
				</div>

				{/* Work Planned */}
				<div className="space-y-2">
					<Label htmlFor="workPlanned" className="text-text-soft">
						What you'll work on next
					</Label>
					<Textarea
						id="workPlanned"
						value={workPlanned}
						onChange={(e) => setWorkPlanned(e.target.value)}
						placeholder="What will you work on next?"
						className="bg-surface-muted border-border-subtle text-text placeholder:text-text-soft min-h-[100px] focus:bg-surface-strong"
						required
					/>
				</div>

				{/* Blockers */}
				<div className="space-y-2">
					<Label htmlFor="blockers" className="text-text-soft">
						Blockers
					</Label>
					<Textarea
						id="blockers"
						value={blockers}
						onChange={(e) => setBlockers(e.target.value)}
						placeholder="Any blockers? (Optional)"
						className="bg-surface-muted border-border-subtle text-text placeholder:text-text-soft min-h-[80px] focus:bg-surface-strong"
					/>
				</div>

				{/* Submit */}
				<Button
					type="submit"
					disabled={saving || saved}
					className="w-full bg-accent hover:bg-accent-strong text-text"
				>
					{saved ? (
						<>
							<CheckCircle2 className="mr-2 h-4 w-4" />
							Saved!
						</>
					) : saving ? (
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
