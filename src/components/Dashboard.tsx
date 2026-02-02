import { useStore } from "../store";
import { useEffect } from "react";
import { RepoSelector } from "./RepoSelector";
import { StandupForm } from "./StandupForm";
import { StandupHistory } from "./StandupHistory";

export function Dashboard() {
	const { user, selectedRepo, loadStandups } = useStore();

	// Load standups from database (with automatic migration)
	useEffect(() => {
		if (user) {
			loadStandups();
		}
	}, [user, loadStandups]);

	return (
		<div className="min-h-screen bg-surface">
			<main className="container mx-auto px-6 py-8 max-w-4xl">
				<div className="mb-8">
					<h2 className="text-3xl font-bold text-text mb-2">
						Welcome back, {user?.name?.split(" ")[0]}!
					</h2>
					<p className="text-text-subtle">
						{selectedRepo
							? "Create your daily standup below."
							: "Select a repository to get started."}
					</p>
				</div>

				<div className="space-y-6">
					<RepoSelector />

					{selectedRepo && (
						<>
							<StandupForm />
							<StandupHistory />
						</>
					)}
				</div>
			</main>
		</div>
	);
}
