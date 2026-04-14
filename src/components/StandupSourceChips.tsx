import { GitBranch } from "lucide-react";
import { Github } from "lucide-react";
import type { GitHubCommit } from "../types";

interface StandupSourceChipsProps {
	repoFullName?: string;
	commits: GitHubCommit[];
}

function getSourceSummary(repoFullName: string | undefined, commits: GitHubCommit[]) {
	const branches = [...new Set(commits.map((c) => c.branch).filter(Boolean))] as string[];

	const repoLabel =
		!repoFullName ? null : repoFullName;

	const branchLabel =
		branches.length === 0 ? null
		: branches.length === 1 ? branches[0]
		: `${branches.length} branches`;

	return { repoLabel, branchLabel };
}

export function StandupSourceChips({ repoFullName, commits }: StandupSourceChipsProps) {
	const { repoLabel, branchLabel } = getSourceSummary(repoFullName, commits);

	if (!repoLabel && !branchLabel) return null;

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{repoLabel && (
				<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-surface-overlay border border-border text-foreground-muted">
					<Github className="h-3 w-3" aria-hidden="true" />
					{repoLabel}
				</span>
			)}
			{branchLabel && (
				<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-surface-overlay border border-border text-foreground-muted">
					<GitBranch className="h-3 w-3" aria-hidden="true" />
					{branchLabel}
				</span>
			)}
		</div>
	);
}
