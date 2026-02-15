import { useState, useEffect, useMemo } from "react";
import { useStore } from "../store";
import { useCommits } from "../hooks/useCommits";
import { useStandups } from "../hooks/useStandups";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, GitCommit, CheckCircle2, Calendar } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, parseISO } from "date-fns";
import type { GitHubCommit } from "../types";

export function StandupForm() {
	const { selectedRepo, selectedBranch } = useStore();
	const { createStandup, isCreating } = useStandups();

	const [workCompleted, setWorkCompleted] = useState("");
	const [workPlanned, setWorkPlanned] = useState("");
	const [blockers, setBlockers] = useState("");
	const [saved, setSaved] = useState(false);

	// Active preset button state
	const [activePreset, setActivePreset] = useState<string | null>(null);

	// Date range for fetching commits
	const [commitStartDate, setCommitStartDate] = useState(
		format(subDays(new Date(), 1), "yyyy-MM-dd"),
	);
	const [commitEndDate, setCommitEndDate] = useState(
		format(new Date(), "yyyy-MM-dd"),
	);

	// Commit selection state
	const [selectedCommits, setSelectedCommits] = useState<Set<string>>(
		new Set(),
	);

	// Sort order preference: true = oldest first, false = newest first
	const [oldestFirst, setOldestFirst] = useState(true);

	const { commits: rawCommits, loading: commitsLoading } = useCommits(
		commitStartDate,
		commitEndDate,
	);

	// Filter commits client-side to match exact date range (handles timezone issues)
	const commits = useMemo(() => {
		return rawCommits.filter((commit) => {
			const commitDate = format(
				new Date(commit.commit.author?.date || new Date()),
				"yyyy-MM-dd",
			);
			return commitDate >= commitStartDate && commitDate <= commitEndDate;
		});
	}, [rawCommits, commitStartDate, commitEndDate]);

	// Auto-select all commits when they load
	useEffect(() => {
		if (commits.length > 0) {
			const ids = new Set(commits.map((c) => c.sha));
			const t = setTimeout(() => setSelectedCommits(ids), 0);
			return () => clearTimeout(t);
		}
	}, [commits]);

	// Group commits by day and sort based on user preference
	const commitsByDay = useMemo(() => {
		const grouped = commits.reduce(
			(acc, commit) => {
				const date = format(
					new Date(commit.commit.author?.date || new Date()),
					"yyyy-MM-dd",
				);
				if (!acc[date]) acc[date] = [];
				acc[date].push(commit);
				return acc;
			},
			{} as Record<string, GitHubCommit[]>,
		);

		// Sort commits within each day based on preference
		for (const date in grouped) {
			grouped[date].sort((a, b) => {
				const timeA = new Date(a.commit.author?.date || 0).getTime();
				const timeB = new Date(b.commit.author?.date || 0).getTime();
				return oldestFirst ? timeA - timeB : timeB - timeA;
			});
		}

		return grouped;
	}, [commits, oldestFirst]);

	// Preset date range functions
	const setYesterdayRange = () => {
		const yesterday = subDays(new Date(), 1);
		setCommitStartDate(format(yesterday, "yyyy-MM-dd"));
		setCommitEndDate(format(yesterday, "yyyy-MM-dd"));
		setActivePreset('yesterday');
	};

	const setTodayRange = () => {
		const today = format(new Date(), "yyyy-MM-dd");
		setCommitStartDate(today);
		setCommitEndDate(today);
		setActivePreset('today');
	};

	const setLastFridayRange = () => {
		const today = new Date();
		const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
		// Calculate days since last Friday
		let daysToLastFriday: number;
		if (dayOfWeek === 0) {
			daysToLastFriday = 2; // Sunday -> Friday was 2 days ago
		} else if (dayOfWeek === 6) {
			daysToLastFriday = 1; // Saturday -> Friday was 1 day ago
		} else {
			daysToLastFriday = dayOfWeek + 2; // Mon(1)->3, Tue(2)->4, Wed(3)->5, Thu(4)->6, Fri(5)->7
		}
		const lastFriday = subDays(today, daysToLastFriday);
		setCommitStartDate(format(lastFriday, "yyyy-MM-dd"));
		setCommitEndDate(format(today, "yyyy-MM-dd"));
		setActivePreset('lastFriday');
	};

	const setLastWeekRange = () => {
		const lastWeekStart = startOfWeek(subDays(new Date(), 7), {
			weekStartsOn: 1,
		});
		const lastWeekEnd = endOfWeek(subDays(new Date(), 7), {
			weekStartsOn: 1,
		});
		setCommitStartDate(format(lastWeekStart, "yyyy-MM-dd"));
		setCommitEndDate(format(lastWeekEnd, "yyyy-MM-dd"));
		setActivePreset('lastWeek');
	};

	const setThisWeekRange = () => {
		const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
		setCommitStartDate(format(weekStart, "yyyy-MM-dd"));
		setCommitEndDate(format(new Date(), "yyyy-MM-dd"));
		setActivePreset('thisWeek');
	};

	// Commit selection functions
	const toggleCommit = (sha: string) => {
		setSelectedCommits((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sha)) {
				newSet.delete(sha);
			} else {
				newSet.add(sha);
			}
			return newSet;
		});
	};

	const selectDay = (dayCommits: GitHubCommit[]) => {
		setSelectedCommits((prev) => {
			const newSet = new Set(prev);
			dayCommits.forEach((c) => newSet.add(c.sha));
			return newSet;
		});
	};

	const deselectDay = (dayCommits: GitHubCommit[]) => {
		setSelectedCommits((prev) => {
			const newSet = new Set(prev);
			dayCommits.forEach((c) => newSet.delete(c.sha));
			return newSet;
		});
	};

	const selectAll = () => {
		setSelectedCommits(new Set(commits.map((c) => c.sha)));
	};

	const deselectAll = () => {
		setSelectedCommits(new Set());
	};

	const handleAutoPopulate = () => {
		const selected = commits.filter((c) => selectedCommits.has(c.sha));

		if (selected.length === 0) return;

		const commitMessages = selected
			.map((commit) => {
				const message = commit.commit.message.split("\n")[0];
				const sha = commit.sha.substring(0, 7);
				return `${message} (\`${sha}\`)`;
			})
			.join("\n");

		setWorkCompleted(commitMessages);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedRepo) return;

		// Only save selected commits (with branch info)
		const selectedCommitObjects = commits
			.filter((c) => selectedCommits.has(c.sha))
			.map((c) => ({ ...c, branch: selectedBranch || selectedRepo.default_branch }));

		createStandup(
			{
				date: format(new Date(), "yyyy-MM-dd"),
				workCompleted,
				workPlanned,
				blockers: blockers || "None",
				taskIds: [],
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

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Date Range Selector */}
				<Card className="p-4 bg-surface-overlay border-border">
					<div className="flex items-center gap-2 mb-3">
						<Calendar className="h-4 w-4 text-foreground-muted" />
						<Label className="text-foreground-muted text-sm">
							Fetch commits from:
						</Label>
					</div>

					{/* Quick Presets */}
					<div className="flex flex-wrap gap-2 mb-3">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={setTodayRange}
							className={`text-xs border border-border ${
								activePreset === 'today'
									? 'bg-accent text-white'
									: 'bg-surface-overlay text-foreground-muted hover:bg-accent hover:text-white'
							} active:scale-95`}
						>
							Today
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={setYesterdayRange}
							className={`text-xs border border-border ${
								activePreset === 'yesterday'
									? 'bg-accent text-white'
									: 'bg-surface-overlay text-foreground-muted hover:bg-accent hover:text-white'
							} active:scale-95`}
						>
							Yesterday
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={setThisWeekRange}
							className={`text-xs border border-border ${
								activePreset === 'thisWeek'
									? 'bg-accent text-white'
									: 'bg-surface-overlay text-foreground-muted hover:bg-accent hover:text-white'
							} active:scale-95`}
						>
							This Week
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={setLastFridayRange}
							className={`text-xs border border-border ${
								activePreset === 'lastFriday'
									? 'bg-accent text-white'
									: 'bg-surface-overlay text-foreground-muted hover:bg-accent hover:text-white'
							} active:scale-95`}
						>
							Last Friday
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={setLastWeekRange}
							className={`text-xs border border-border ${
								activePreset === 'lastWeek'
									? 'bg-accent text-white'
									: 'bg-surface-overlay text-foreground-muted hover:bg-accent hover:text-white'
							} active:scale-95`}
						>
							Last Week
						</Button>
					</div>
					{/* Custom Date Inputs */}
					<div className="grid grid-cols-2 gap-3 mb-3">
						<div className="space-y-1">
							<Label
								htmlFor="start-date"
								className="text-xs text-foreground-muted"
							>
								Start Date
							</Label>
							<Input
								id="start-date"
								type="date"
								value={commitStartDate}
								onChange={(e) => {
									setCommitStartDate(e.target.value);
									setActivePreset(null);
								}}
								className="bg-surface-overlay border-border text-foreground text-sm"
							/>
						</div>

						<div className="space-y-1">
							<Label
								htmlFor="end-date"
								className="text-xs text-foreground-muted"
							>
								End Date
							</Label>
							<Input
								id="end-date"
								type="date"
								value={commitEndDate}
								onChange={(e) => {
									setCommitEndDate(e.target.value);
									setActivePreset(null);
								}}
								max={format(new Date(), "yyyy-MM-dd")}
								className="bg-surface-overlay border-border text-foreground text-sm"
							/>
						</div>
					</div>

					{/* Commit Previewer - Grouped by Day */}
					{commits.length > 0 && (
						<div className="border-t border-border pt-3">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-3">
									<span className="text-sm text-foreground-muted">
										{commits.length} commit
										{commits.length !== 1 ? "s" : ""} found •{" "}
										{selectedCommits.size} selected
									</span>
									<div className="flex rounded-md border border-border overflow-hidden">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setOldestFirst(true)}
											className={`text-xs rounded-none px-2 ${
												oldestFirst
													? "bg-accent text-white hover:bg-accent"
													: "text-foreground-muted hover:bg-surface-overlay"
											}`}
										>
											Oldest First
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setOldestFirst(false)}
											className={`text-xs rounded-none px-2 ${
												!oldestFirst
													? "bg-accent text-white hover:bg-accent"
													: "text-foreground-muted hover:bg-surface-overlay"
											}`}
										>
											Newest First
										</Button>
									</div>
								</div>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={selectAll}
										className="text-xs text-accent-text hover:text-accent-active hover:bg-surface-overlay"
									>
										Select All
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={deselectAll}
										className="text-xs text-foreground-muted hover:text-foreground-muted hover:bg-surface-overlay"
									>
										Clear
									</Button>
								</div>
							</div>

							{/* Grouped Commits with Accordion */}
							<ScrollArea className="h-80">
								<Accordion
									type="multiple"
									defaultValue={Object.keys(commitsByDay)}
									className="w-full"
								>
									{Object.entries(commitsByDay)
										.sort(([dateA], [dateB]) =>
											dateA.localeCompare(dateB),
										)
										.map(([date, dayCommits]) => {
											const allSelected =
												dayCommits.every((c) =>
													selectedCommits.has(c.sha),
												);

											return (
												<AccordionItem
													key={date}
													value={date}
												>
													<div className="flex items-center justify-between">
														<AccordionTrigger className="hover:no-underline flex-1">
															<div className="flex items-center gap-2">
																<span className="text-sm font-medium text-foreground">
																	{format(
																		parseISO(
																			date,
																		),
																		"EEEE, MMM d",
																	)}
																</span>
																<span className="text-xs text-foreground-muted">
																	(
																	{
																		dayCommits.length
																	}
																	)
																</span>
															</div>
														</AccordionTrigger>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																if (allSelected) {
																	deselectDay(dayCommits);
																} else {
																	selectDay(dayCommits);
																}
															}}
															className="text-xs text-accent-text hover:text-accent-active hover:bg-surface-overlay mr-2"
														>
															{allSelected
																? "Deselect all"
																: "Select all"}
														</Button>
													</div>

													<AccordionContent>
														<div className="space-y-1 ml-4">
															{dayCommits.map(
																(commit) => (
																	<label
																		key={
																			commit.sha
																		}
																		className="flex items-start gap-3 p-2 rounded hover:bg-surface-overlay cursor-pointer"
																	>
																		<Checkbox
																			checked={selectedCommits.has(
																				commit.sha,
																			)}
																			onCheckedChange={() =>
																				toggleCommit(
																					commit.sha,
																				)
																			}
																			className="mt-0.5"
																		/>
																		<div className="flex-1 min-w-0">
																			<p className="text-sm text-foreground-muted truncate">
																				{
																					commit.commit.message.split(
																						"\n",
																					)[0]
																				}
																			</p>
																			<code className="text-xs text-accent-text font-mono">
																				{commit.sha.substring(
																					0,
																					7,
																				)}
																			</code>
																		</div>
																	</label>
																),
															)}
														</div>
													</AccordionContent>
												</AccordionItem>
											);
										})}
								</Accordion>
							</ScrollArea>

							{/* Auto-populate Button */}
							<div className="mt-3 pt-3 border-t border-border">
								<Button
									type="button"
									onClick={handleAutoPopulate}
									disabled={selectedCommits.size === 0}
									className="w-full bg-accent hover:bg-accent-hover text-white disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{commitsLoading ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Loading...
										</>
									) : (
										<>
											Auto-populate (
											{selectedCommits.size} selected)
										</>
									)}
								</Button>
							</div>
						</div>
					)}

					{commits.length === 0 && !commitsLoading && (
						<div className="text-center py-4 text-sm text-foreground-muted">
							No commits found for selected date range
						</div>
					)}
				</Card>

				{/* Work Completed */}
				<div className="space-y-2">
					<Label htmlFor="workCompleted" className="text-foreground-muted">
						Completed
					</Label>
					<Textarea
						id="workCompleted"
						value={workCompleted}
						onChange={(e) => setWorkCompleted(e.target.value)}
						placeholder="What did you work on during this period?"
						className="bg-surface-overlay border-border text-foreground placeholder:text-foreground-muted min-h-[100px] focus:bg-surface-raised"
						required
					/>
				</div>

				{/* Work Planned */}
				<div className="space-y-2">
					<Label htmlFor="workPlanned" className="text-foreground-muted">
						Planned
					</Label>
					<Textarea
						id="workPlanned"
						value={workPlanned}
						onChange={(e) => setWorkPlanned(e.target.value)}
						placeholder="What will you work on next?"
						className="bg-surface-overlay border-border text-foreground placeholder:text-foreground-muted min-h-[100px] focus:bg-surface-raised"
						required
					/>
				</div>

				{/* Blockers */}
				<div className="space-y-2">
					<Label htmlFor="blockers" className="text-foreground-muted">
						Blockers
					</Label>
					<Textarea
						id="blockers"
						value={blockers}
						onChange={(e) => setBlockers(e.target.value)}
						placeholder="Any blockers? (Optional)"
						className="bg-surface-overlay border-border text-foreground placeholder:text-foreground-muted min-h-[80px] focus:bg-surface-raised"
					/>
				</div>

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
