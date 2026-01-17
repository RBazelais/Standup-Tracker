import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Dashboard() {
	const { user, logout } = useStore();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	return (
		<div className="min-h-screen bg-slate-950">
			<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
				<div className="container mx-auto px-6 py-4 flex items-center justify-between">
					<h1 className="text-xl font-bold text-white">StandUp</h1>

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
							className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
						>
							Logout
						</Button>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8">
				<div className="text-center text-white">
					<h2 className="text-3xl font-bold mb-4">
						Welcome, {user?.name}! 🎉
					</h2>
					<p className="text-slate-400">Dashboard coming soon...</p>
				</div>
			</main>
		</div>
	);
}
