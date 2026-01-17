import { useStore } from "../store";
import { useRepos } from "../hooks/useGitHub";
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
			<Card className="p-6 bg-slate-800/50 border-slate-700">
				<div className="flex items-center justify-center gap-2 text-slate-400">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>Loading repositories...</span>
				</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="p-6 bg-slate-800/50 border-slate-700">
				<div className="text-center text-red-400">
					<p>Failed to load repositories</p>
					<p className="text-sm text-slate-500 mt-2">{error}</p>
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-6 bg-slate-800/50 border-slate-700">
			<div className="flex items-center gap-3 mb-4">
				<GitBranch className="h-5 w-5 text-blue-500" />
				<h2 className="text-lg font-semibold text-white">
					Select Repository
				</h2>
			</div>

			<Select
				value={selectedRepo?.full_name || ""}
				onValueChange={(value) => {
					const repo = repos.find((r) => r.full_name === value);
					if (repo) setSelectedRepo(repo);
				}}
			>
				<SelectTrigger className="bg-slate-900 border-slate-700 text-white">
					<SelectValue placeholder="Choose a repository to track" />
				</SelectTrigger>
				<SelectContent className="bg-slate-900 border-slate-700">
					{repos.map((repo) => (
						<SelectItem
							key={repo.id}
							value={repo.full_name}
							className="text-white hover:bg-slate-800 focus:bg-slate-800"
						>
							<div className="flex items-center gap-2">
								<span>{repo.name}</span>
								{repo.private && (
									<span className="text-xs text-slate-500">
										(private)
									</span>
								)}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{selectedRepo && (
				<div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
					<p className="text-sm text-slate-400">
						Tracking:{" "}
						<span className="text-white font-medium">
							{selectedRepo.full_name}
						</span>
					</p>
				</div>
			)}
		</Card>
	);
}
