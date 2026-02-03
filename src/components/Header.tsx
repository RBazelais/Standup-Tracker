import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store";
import { Button } from "@/components/ui/button";

export function Header() {
	const navigate = useNavigate();
	const { user, logout } = useStore();

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	const isAuthenticated = Boolean(user?.id || user?.login);
	const homePath = isAuthenticated ? "/dashboard" : "/";

	return (
		<header className="border-ball bg-surface-raised backdrop-blur">
			<div className="container mx-auto px-6 py-4 flex items-center justify-between">
				<h1 className="text-xl font-bold text-text">
					<Link to={homePath}>StandUp Tracker</Link>
				</h1>
				<div className="flex items-center gap-4">
					{isAuthenticated ? (
						<>
							<div className="flex items-center gap-3">
								<img
									src={user?.avatar_url}
									alt={user?.name ?? "User avatar"}
									className="h-8 w-8 rounded-full"
								/>
								<span className="text-sm text-text-soft">{user?.name}</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleLogout}
								className="bg-surface-raised border-border hover:bg-surface-strong hover:text-text text-text-soft"
							>
								Logout
							</Button>
						</>
					) : (
						<Link to="/">
							<Button variant="outline" size="sm" className="bg-surface-raised border-border hover:bg-surface-strong text-text">
								Login
							</Button>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
