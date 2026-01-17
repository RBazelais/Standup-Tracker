import { Card } from "@/components/ui/card";

interface StandupPreviewProps {
	isDark: boolean;
}

export function StandupPreview({ isDark }: StandupPreviewProps) {
	return (
		<Card
			className={`p-8 backdrop-blur ${
				isDark
					? "bg-slate-800/50 border-slate-700"
					: "bg-white/80 border-slate-200"
			}`}
		>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3
						className={`text-lg font-semibold ${
							isDark ? "text-white" : "text-slate-900"
						}`}
					>
						Today's Standup
					</h3>
					<span
						className={`text-sm ${
							isDark ? "text-slate-400" : "text-slate-600"
						}`}
					>
						Jan 16, 2026
					</span>
				</div>

				<div className="space-y-3">
					<PreviewField
						isDark={isDark}
						label="Yesterday"
						content="Implemented GitHub OAuth flow • Fixed TypeScript types for nullable fields • Set up Zustand store"
					/>

					<PreviewField
						isDark={isDark}
						label="Today"
						content="Build landing page • Create standup form component • Integrate commit fetching"
					/>

					<PreviewField
						isDark={isDark}
						label="Blockers"
						content="None"
					/>
				</div>

				<div className="flex gap-2 pt-2">
					<span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
						🎯 Launch MVP
					</span>
					<span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
						🚀 Portfolio Project
					</span>
				</div>
			</div>
		</Card>
	);
}

interface PreviewFieldProps {
	isDark: boolean;
	label: string;
	content: string;
}

function PreviewField({ isDark, label, content }: PreviewFieldProps) {
	return (
		<div className="text-left">
			<label
				className={`text-sm font-medium mb-1 block ${
					isDark ? "text-slate-300" : "text-slate-700"
				}`}
			>
				{label}
			</label>
			<p
				className={`text-sm ${
					isDark ? "text-slate-400" : "text-slate-600"
				}`}
			>
				{content}
			</p>
		</div>
	);
}
