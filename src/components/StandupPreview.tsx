import { Card } from "@/components/ui/card";

export function StandupPreview() {
	return (
		<Card
			className="p-8 backdrop-blur bg-slate-800/50 border-slate-700"
		>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-white">
						Today's Standup
					</h3>
					<span className="text-sm text-slate-400">
						Jan 16, 2026
					</span>
				</div>

				<div className="space-y-3">
					<PreviewField
						label="Yesterday"
						content="Implemented GitHub OAuth flow 
                        • Fixed TypeScript types for nullable fields 
                        • Set up Zustand store"
					/>

					<PreviewField
						label="Today"
						content="Build landing page • Create standup form component • Integrate commit fetching"
					/>

					<PreviewField
						label="Blockers"
						content="None"
					/>
				</div>

				{/* <div className="flex gap-2 pt-2">
					<span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
						🎯 Launch MVP
					</span>
					<span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
						🚀 Portfolio Project
					</span>
				</div> */}
			</div>
		</Card>
	);
}

interface PreviewFieldProps {
	label: string;
	content: string;
}

function PreviewField({ label, content }: PreviewFieldProps) {
	return (
		<div className="text-left">
			<label className="text-sm font-medium mb-1 block text-slate-300">
				{label}
			</label>
			<p className="text-sm text-slate-400">
				{content}
			</p>
		</div>
	);
}
