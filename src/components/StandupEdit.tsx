import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Footer } from "./Footer";
import { useStore } from "../store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Save, X } from "lucide-react";
import type { Standup } from "../types";

export function StandupEdit() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user, logout, updateStandup } = useStore();

	const [standup, setStandup] = useState<Standup | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [workCompleted, setWorkCompleted] = useState("");
	const [workPlanned, setWorkPlanned] = useState("");
	const [blockers, setBlockers] = useState("");

	useEffect(() => {
		const fetchStandup = async () => {
			if (!id) {
				setError("No standup ID provided");
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`/api/standups/${id}`);

				if (response.ok) {
					const data = await response.json();
					setStandup(data);
					setWorkCompleted(data.workCompleted);
					setWorkPlanned(data.workPlanned);
					setBlockers(data.blockers);
				} else if (response.status === 404) {
					setError("Standup not found");
				} else {
					setError("Failed to load standup");
				}
			} catch (err) {
				console.error("Error fetching standup:", err);
				setError("Failed to load standup");
			} finally {
				setLoading(false);
			}
		};

		fetchStandup();
	}, [id]);

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	const handleCancel = () => {
		navigate(`/standup/${id}`);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!id) return;

		setSaving(true);

		try {
			await updateStandup(id, {
				workCompleted,
				workPlanned,
				blockers,
			});

			navigate(`/standup/${id}`);
		} catch (err) {
			console.error("Failed to update standup:", err);
			alert("Failed to save changes. Please try again.");
			setSaving(false);
		}
	};

	if (loading) {
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
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
					</div>
				</main>
			</div>
		);
	}

	if (error || !standup) {
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
					<Card className="p-8 bg-slate-800/50 border-slate-700 text-center">
						<h2 className="text-2xl font-bold text-white mb-4">
							Standup Not Found
						</h2>
						<p className="text-slate-400 mb-6">
							{error || "This standup doesn't exist."}
						</p>
						<Link to="/dashboard">
							<Button className="bg-blue-600 hover:bg-blue-700 text-white">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Dashboard
							</Button>
						</Link>
					</Card>
				</main>
			</div>
		);
	}

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
				{/* Breadcrumb */}
				<div className="mb-6">
					<Link to={`/standup/${id}`}>
						<Button
							variant="ghost"
							size="sm"
							className="text-slate-400 hover:text-white hover:bg-slate-800"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Standup
						</Button>
					</Link>
				</div>

				{/* Edit Form */}
				<Card className="p-8 bg-slate-800/50 border-slate-700">
					<h2 className="text-2xl font-bold text-white mb-6">
						Edit Standup
					</h2>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Work Completed */}
						<div className="space-y-2">
							<Label
								htmlFor="workCompleted"
								className="text-slate-300"
							>
								Work Completed
							</Label>
							<Textarea
								id="workCompleted"
								value={workCompleted}
								onChange={(e) => setWorkCompleted(e.target.value)}
								placeholder="What did you work on?"
								className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px]"
								required
							/>
						</div>

						{/* Work Planned */}
						<div className="space-y-2">
							<Label htmlFor="workPlanned" className="text-slate-300">
								Work Planned
							</Label>
							<Textarea
								id="workPlanned"
								value={workPlanned}
								onChange={(e) => setWorkPlanned(e.target.value)}
								placeholder="What will you work on next?"
								className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px]"
								required
							/>
						</div>

						{/* Blockers */}
						<div className="space-y-2">
							<Label
								htmlFor="blockers"
								className="text-slate-300"
							>
								Blockers
							</Label>
							<Textarea
								id="blockers"
								value={blockers}
								onChange={(e) => setBlockers(e.target.value)}
								placeholder="Any blockers?"
								className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
								required
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 pt-4">
							<Button
								type="submit"
								disabled={saving}
								className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
							>
								{saving ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={saving}
								className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white"
							>
								<X className="mr-2 h-4 w-4" />
								Cancel
							</Button>
						</div>
					</form>
				</Card>
			</main>
            <Footer />
		</div>
	);
}
