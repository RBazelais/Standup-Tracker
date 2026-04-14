import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { groupCommitsByDay } from "../utils/commitUtils";
import type { GitHubCommit } from "../types";

interface CommitPreviewerProps {
	commits: GitHubCommit[];
	loading: boolean;
	selectedCommits: Set<string>;
	onToggleCommit: (sha: string) => void;
	onSelectDay: (commits: GitHubCommit[]) => void;
	onDeselectDay: (commits: GitHubCommit[]) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onAutoPopulate: () => void;
	oldestFirst: boolean;
	onOldestFirstChange: (oldestFirst: boolean) => void;
}

export function CommitPreviewer({
	commits,
	loading,
	selectedCommits,
	onToggleCommit,
	onSelectDay,
	onDeselectDay,
	onSelectAll,
	onDeselectAll,
	onAutoPopulate,
	oldestFirst,
	onOldestFirstChange,
}: CommitPreviewerProps) {
	const commitsByDay = useMemo(
		() => groupCommitsByDay(commits, oldestFirst),
		[commits, oldestFirst],
	);

	if (commits.length === 0 && !loading) {
		return (
			<div className="text-center py-4 text-sm text-foreground-muted">
				No commits found for selected date range
			</div>
		);
	}

	if (commits.length === 0) return null;

	return (
		<div className="border-t border-border pt-3">
			{/* Controls row */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-3">
					<span className="text-sm text-foreground-muted">
						{commits.length} commit{commits.length !== 1 ? "s" : ""} found •{" "}
						{selectedCommits.size} selected
					</span>
					<div className="flex rounded-md border border-border overflow-hidden">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onOldestFirstChange(true)}
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
							onClick={() => onOldestFirstChange(false)}
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
						onClick={onSelectAll}
						className="text-xs text-accent-text hover:text-accent-active hover:bg-surface-overlay"
					>
						Select All
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onDeselectAll}
						className="text-xs text-foreground-muted hover:text-foreground-muted hover:bg-surface-overlay"
					>
						Clear
					</Button>
				</div>
			</div>

			{/* Grouped commits accordion */}
			<ScrollArea className="h-80">
				<Accordion
					type="multiple"
					defaultValue={Object.keys(commitsByDay)}
					className="w-full"
				>
					{Object.entries(commitsByDay)
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([date, dayCommits]) => {
							const allSelected = dayCommits.every((c) =>
								selectedCommits.has(c.sha),
							);
							return (
								<AccordionItem key={date} value={date}>
									<div className="flex items-center justify-between">
										<AccordionTrigger className="hover:no-underline flex-1">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-foreground">
													{format(parseISO(date), "EEEE, MMM d")}
												</span>
												<span className="text-xs text-foreground-muted">
													({dayCommits.length})
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
													onDeselectDay(dayCommits);
												} else {
													onSelectDay(dayCommits);
												}
											}}
											className="text-xs text-accent-text hover:text-accent-active hover:bg-surface-overlay mr-2"
										>
											{allSelected ? "Deselect all" : "Select all"}
										</Button>
									</div>
									<AccordionContent>
										<div className="space-y-1 ml-4">
											{dayCommits.map((commit) => (
												<label
													key={commit.sha}
													htmlFor={`commit-${commit.sha}`}
													className="flex items-start gap-3 p-2 rounded hover:bg-surface-overlay cursor-pointer"
												>
													<Checkbox
														id={`commit-${commit.sha}`}
														checked={selectedCommits.has(commit.sha)}
														onCheckedChange={() => onToggleCommit(commit.sha)}
														className="mt-0.5"
													/>
													<div className="flex-1 min-w-0">
														<p className="text-sm text-foreground-muted truncate">
															{commit.commit.message.split("\n")[0]}
														</p>
														<code className="text-xs text-accent-text font-mono">
															{commit.sha.substring(0, 7)}
														</code>
													</div>
												</label>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							);
						})}
				</Accordion>
			</ScrollArea>

			{/* Auto-populate button */}
			<div className="mt-3 pt-3 border-t border-border">
				<Button
					type="button"
					onClick={onAutoPopulate}
					disabled={selectedCommits.size === 0}
					className="w-full bg-accent hover:bg-accent-hover text-white disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							Loading...
						</>
					) : (
						<>Auto-populate ({selectedCommits.size} selected)</>
					)}
				</Button>
			</div>
		</div>
	);
}
