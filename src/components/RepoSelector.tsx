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
		setSelectedBranch(null); // Reset branch when repo changes
	};

	const handleBranchChange = (branch: string) => {
		setSelectedBranch(branch);
	};

	return (
		<Card className="p-6 bg-surface-raised border-border">
			<div className="space-y-4">
				{/* Repository Selector */}
				<div className="space-y-2">
					<Label className="text-text-soft flex items-center gap-2">
						<GitFork className="h-4 w-4" />
						Repository
					</Label>
					<Select value={selectedRepo?.full_name} onValueChange={handleRepoChange}>
						<SelectTrigger className="bg-surface-overlay border-border text-text">
							<SelectValue placeholder="Select a repository" />
						</SelectTrigger>
						<SelectContent className="bg-surface-raised border-border">
							{repos.map((repo) => (
								<SelectItem
									key={repo.id}
									value={repo.full_name}
									className="text-text hover:bg-surface-overlay"
								>
									{repo.full_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Branch Selector */}
				{selectedRepo && (
					<div className="space-y-2">
						<Label className="text-text-soft flex items-center gap-2">
							<GitBranch className="h-4 w-4" />
							Branch
						</Label>
						<Select
							value={selectedBranch || undefined}
							onValueChange={handleBranchChange}
							disabled={branchesLoading}
						>
							<SelectTrigger className="bg-surface-overlay border-border text-text">
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
										className="text-text hover:bg-surface-overlay"
									>
										{branch}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedBranch && (
							<p className="text-xs text-text-muted">
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