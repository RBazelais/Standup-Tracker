import { useStore } from "../store";
import { useRepos } from "../hooks/useRepos";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { GitBranch, Loader2 } from "lucide-react";

export function RepoSelector() {
	const { repos, loading, error } = useRepos();
	const { selectedRepo, setSelectedRepo } = useStore();

	if (loading) {
		return (
			<Card className="p-6 bg-surface-raised border-border">
				<div className="flex items-center justify-center gap-2 text-text-subtle">
					<Loader2 className="h-5 w-5 animate-spin text-accent" />
					<span>Loading repositories...</span>
				</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="p-6 bg-surface-raised border-border">
				<div className="text-center text-danger-text">
					<p>Failed to load repositories</p>
					<p className="text-sm text-text-muted mt-2">{error}</p>
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-6 bg-surface-raised border-border">
			<div className="flex items-center gap-3 mb-4">
				<GitBranch className="h-5 w-5 text-accent" />
				<h2 className="text-lg font-semibold text-text">Select Repository</h2>
			</div>

			<Select
				value={selectedRepo?.full_name || ""}
				onValueChange={(value) => {
					const repo = repos.find((r) => r.full_name === value);
					if (repo) setSelectedRepo(repo);
				}}
			>
				<SelectTrigger className="bg-surface-raised border-border text-text">
					<SelectValue placeholder="Choose a repository to track" />
				</SelectTrigger>
				<SelectContent className="bg-surface-raised border-border">
					{repos.map((repo) => (
						<SelectItem
							key={repo.id}
							value={repo.full_name}
							className="text-text hover:bg-surface-overlay focus:bg-surface-overlay"
						>
							<div className="flex items-center gap-2">
								<span>{repo.name}</span>
								{repo.private && (
									<span className="text-xs text-text-muted">
										(private)
									</span>
								)}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{selectedRepo && (
				<div className="mt-4 p-4 bg-surface-raised rounded-lg">
					<p className="text-sm text-text-subtle">
						Tracking: {" "}
						<span className="text-text font-medium">{selectedRepo.full_name}</span>
					</p>
				</div>
			)}
		</Card>
	);
}
