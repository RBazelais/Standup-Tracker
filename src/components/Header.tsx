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
		<header className="border-b bg-surface-raised backdrop-blur" role="banner">
			<div className="container mx-auto px-6 py-4 flex items-center justify-between">
				<h1 className="text-xl font-bold text-foreground">
					<Link to={homePath} aria-label="StandUp Tracker Home">StandUp Tracker</Link>
				</h1>
				<nav aria-label="Main navigation">
					<div className="flex items-center gap-4">
						{isAuthenticated ? (
							<>
								<div className="flex items-center gap-3" aria-label="User information">
									<img
										src={user?.avatar_url}
										alt=""
										aria-hidden="true"
										className="h-8 w-8 rounded-full"
									/>
									<span className="text-sm text-foreground-muted" aria-label={`Logged in as ${user?.name}`}>{user?.name}</span>
								</div>
								<Button
									variant="outline"
									size="sm"
									aria-label="Logout from your account"
									onClick={handleLogout}
									className="bg-surface-raised border-border hover:bg-surface-strong hover:text-foreground text-foreground-muted"
								>
									Logout
								</Button>
							</>
						) : (
							<Link to="/">
								<Button variant="outline" size="sm" aria-label="Login to your account" className="bg-surface-raised border-border hover:bg-surface-strong text-foreground">
									Login
								</Button>
							</Link>
						)}
					</div>
				</nav>
			</div>
		</header>
	);
}
