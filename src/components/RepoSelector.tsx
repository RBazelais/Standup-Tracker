import { useStore } from "../store";
import { useBranches } from "../hooks/useBranches";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GitBranch, GitFork } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function RepoSelector() {
	const { repos, selectedRepo, setSelectedRepo, selectedBranch, setSelectedBranch } = useStore();
	const { branches, loading: branchesLoading } = useBranches();

	const handleRepoChange = (repoFullName: string) => {
		const repo = repos.find((r) => r.full_name === repoFullName);
		setSelectedRepo(repo || null);
		setSelectedBranch(repo?.default_branch || null); // Auto-select default branch
	};

	const handleBranchChange = (branch: string) => {
		setSelectedBranch(branch);
	};

	return (
		<Card className="p-6 bg-surface-raised border-border">
			<div className="space-y-4">
				{/* Repository Selector */}
				<div className="space-y-2">
					<Label htmlFor="repo-select" className="text-foreground font-medium flex items-center gap-2">
						<GitFork className="h-4 w-4" aria-hidden="true" />
						Repository
					</Label>
					<Select value={selectedRepo?.full_name} onValueChange={handleRepoChange}>
						<SelectTrigger id="repo-select" className="bg-surface-overlay border-border text-foreground" aria-label="Select repository">
							<SelectValue placeholder="Select a repository" />
						</SelectTrigger>
						<SelectContent className="bg-surface-raised border-border">
							{repos.map((repo) => {
								const repoName = repo.full_name.split("/").pop();
								return (
									<SelectItem
										key={repo.id}
										value={repo.full_name}
										className="text-foreground hover:bg-surface-overlay"
									>
										{repoName}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>

				{/* Branch Selector */}
				{selectedRepo && (
					<div className="space-y-2">
						<Label htmlFor="branch-select" className="text-foreground font-medium flex items-center gap-2">
							<GitBranch className="h-4 w-4" aria-hidden="true" />
							Branch
						</Label>
						<Select
							value={selectedBranch || undefined}
							onValueChange={handleBranchChange}
							disabled={branchesLoading}
						>
							<SelectTrigger 
								id="branch-select"
								className="bg-surface-overlay border-border text-foreground"
								aria-label="Select branch"
								aria-busy={branchesLoading}
							>
								<SelectValue
									placeholder={
										branchesLoading ? "Loading branches..." : "Default branch"
									}
								/>
							</SelectTrigger>
							<SelectContent className="bg-surface-raised border-border">
								{branches.map((branch) => (
									<SelectItem
										key={branch}
										value={branch}
										className="text-foreground hover:bg-surface-overlay"
									>
										{branch}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedBranch && (
							<p className="text-xs text-foreground-muted" role="status" aria-live="polite">
								Fetching commits from{" "}
								<code className="text-accent-text">{selectedBranch}</code>
							</p>
						)}
					</div>
				)}
			</div>
		</Card>
	);
}