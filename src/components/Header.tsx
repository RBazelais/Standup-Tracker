import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
					{isAuthenticated ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
									aria-label="Open user menu"
								>
									<span className="text-sm text-foreground-muted" aria-hidden="true">{user?.login}</span>
									<img
										src={user?.avatar_url}
										alt=""
										aria-hidden="true"
										className="h-8 w-8 rounded-full"
									/>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuLabel className="font-normal">
									<p className="text-sm font-medium text-foreground">{user?.name}</p>
									<p className="text-xs text-foreground-muted">{user?.login}</p>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => navigate("/settings")}>
									Settings
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleLogout}>
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Link to="/">
							<Button variant="outline" size="sm" aria-label="Login to your account" className="bg-surface-raised border-border hover:bg-surface-overlay text-foreground">
								Login
							</Button>
						</Link>
					)}
				</nav>
			</div>
		</header>
	);
}
