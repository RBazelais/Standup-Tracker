import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { Button } from "@/components/ui/button";

export function Header() {
	const navigate = useNavigate();
	const { user, logout } = useStore();

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	return (
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
	);
}
