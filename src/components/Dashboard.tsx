import { useStore } from "../store";
import { useEffect } from "react";
import { useRepos } from "../hooks/useRepos";
import { RepoSelector } from "./RepoSelector";
import { StandupForm } from "./StandupForm";
import { StandupHistory } from "./StandupHistory";

export function Dashboard() {
	const { user, selectedRepo, setRepos } = useStore();
	const { repos } = useRepos();

	// Sync repos from hook to store
	useEffect(() => {
		if (repos.length > 0) {
			setRepos(repos);
		}
	}, [repos, setRepos]);

	return (
		<div className="min-h-screen bg-surface">
			<main className="container mx-auto px-6 py-8 max-w-4xl">
				<header className="mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">
						Welcome back, {user?.name?.split(" ")[0]}!
					</h1>
					<p className="text-lg text-foreground-muted">
						{selectedRepo
							? "Create a daily standup note below."
							: "Select a repository to get started."}
					</p>
				</header>

				<div className="space-y-6">
					<section aria-labelledby="repo-selector-heading">
					<h2 id="repo-selector-heading" className="text-sm font-medium text-foreground-muted mb-2">
							Select Repository
						</h2>
						<RepoSelector />
					</section>

					{selectedRepo && (
						<>
							<section aria-labelledby="standup-form-heading">
							<h2 id="standup-form-heading" className="text-sm font-medium text-foreground-muted mb-2">
									Create Standup Note
								</h2>
								<StandupForm />
							</section>
							<section aria-labelledby="standup-history-heading">
							<h2 id="standup-history-heading" className="text-sm font-medium text-foreground-muted mb-2">
									Standup History
								</h2>
								<StandupHistory />
							</section>
						</>
					)}
				</div>
			</main>
		</div>
	);
}
