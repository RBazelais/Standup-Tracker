import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RepoSelector } from "./RepoSelector";
import { StandupForm } from "./StandupForm";
import { StandupHistory } from "./StandupHistory";

export function Dashboard() {
	const { user, logout, selectedRepo, loadStandups } = useStore();
	const navigate = useNavigate();

	// Load standups from database (with automatic migration)
	useEffect(() => {
		if (user) {
			loadStandups();
		}
	}, [user]);

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
			<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
				<div className="container mx-auto px-6 py-4 flex items-center justify-between">
					<h1 className="text-xl font-bold text-white">
						StandUp Tracker
					</h1>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-3">
							<img
								src={user?.avatar_url}
								alt={user?.name}
								className="h-8 w-8 rounded-full"
							/>
							<span className="text-sm text-slate-300">
								{user?.name}
							</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleLogout}
							className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300"
						>
							Logout
						</Button>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8 max-w-4xl">
				<div className="mb-8">
					<h2 className="text-3xl font-bold text-white mb-2">
						Welcome back, {user?.name?.split(" ")[0]}!
					</h2>
					<p className="text-slate-400">
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
