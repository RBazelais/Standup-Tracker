import { useState } from "react";
import { useStore } from "../store";
import { useCommits } from "../hooks/useCommits";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, GitCommit, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export function StandupForm() {
	const { selectedRepo, addStandup } = useStore();
	const { commits, loading: commitsLoading } = useCommits();

	const [yesterday, setYesterday] = useState("");
	const [today, setToday] = useState("");
	const [blockers, setBlockers] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	// Auto-populate yesterday field from commits
	const handleAutoPopulate = () => {
		if (commits.length === 0) return;

		const commitMessages = commits
			.map((commit) => commit.commit.message.split("\n")[0]) // First line only
			.join(" • ");

		setYesterday(commitMessages);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedRepo) return;

		setSaving(true);

		// Create standup
		const standup = {
			id: crypto.randomUUID(),
			date: format(new Date(), "yyyy-MM-dd"),
			yesterday,
			today,
			blockers: blockers || "None",
			goalIds: [],
			commits,
			repoFullName: selectedRepo.full_name,
			createdAt: new Date().toISOString(),
		};

		addStandup(standup);

		// Show success state
		setSaving(false);
		setSaved(true);

		// Reset form after 2 seconds
		setTimeout(() => {
			setYesterday("");
			setToday("");
			setBlockers("");
			setSaved(false);
		}, 2000);
	};

	if (!selectedRepo) {
		return (
			<Card className="p-8 bg-slate-800/50 border-slate-700 text-center">
				<p className="text-slate-400">
					Select a repository to create a standup note
				</p>
			</Card>
		);
	}

	return (
		<Card className="p-6 bg-slate-800/50 border-slate-700">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<GitCommit className="h-5 w-5 text-blue-500" />
					<h2 className="text-lg font-semibold text-white">
						Create Standup note
					</h2>
				</div>

				<span className="text-sm text-slate-400">
					{format(new Date(), "EEEE, MMM d, yyyy")}
				</span>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Yesterday */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="yesterday" className="text-slate-300">
							Yesterday
						</Label>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleAutoPopulate}
							disabled={commitsLoading || commits.length === 0}
							className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
						>
							{commitsLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<>Auto-populate ({commits.length} commits)</>
							)}
						</Button>
					</div>
					<Textarea
						id="yesterday"
						value={yesterday}
						onChange={(e) => setYesterday(e.target.value)}
						placeholder="What did you work on yesterday?"
						className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
						required
					/>
				</div>

				{/* Today */}
				<div className="space-y-2">
					<Label htmlFor="today" className="text-slate-300">
						Today
					</Label>
					<Textarea
						id="today"
						value={today}
						onChange={(e) => setToday(e.target.value)}
						placeholder="What will you work on today?"
						className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
						required
					/>
				</div>

				{/* Blockers */}
				<div className="space-y-2">
					<Label htmlFor="blockers" className="text-slate-300">
						Blockers
					</Label>
					<Textarea
						id="blockers"
						value={blockers}
						onChange={(e) => setBlockers(e.target.value)}
						placeholder="Any blockers? (Optional)"
						className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
					/>
				</div>

				{/* Submit */}
				<Button
					type="submit"
					disabled={saving || saved}
					className="w-full bg-blue-600 hover:bg-blue-700 text-white"
				>
					{saved ? (
						<>
							<CheckCircle2 className="mr-2 h-4 w-4" />
							Saved!
						</>
					) : saving ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Saving...
						</>
					) : (
						"Save Standup Note"
					)}
				</Button>
			</form>
		</Card>
	);
}
