import { Card } from "@/components/ui/card";

interface FeatureCardProps {
	isDark: boolean;
	icon: React.ReactNode;
	title: string;
	description: string;
}

export function FeatureCard({
	isDark,
	icon,
	title,
	description,
}: FeatureCardProps) {
	return (
		<Card
			className={`p-6 backdrop-blur transition-all text-left ${
				isDark
					? "bg-slate-800/30 border-slate-700 hover:bg-slate-800/50"
					: "bg-white/60 border-slate-200 hover:shadow-lg"
			}`}
		>
			<div className="flex items-center gap-3 mb-3">
				{icon}
				<h3
					className={`text-lg font-semibold ${
						isDark ? "text-white" : "text-slate-900"
					}`}
				>
					{title}
				</h3>
			</div>
			<p
				className={`text-sm leading-relaxed ${
					isDark ? "text-slate-400" : "text-slate-600"
				}`}
			>
				{description}
			</p>
		</Card>
	);
}
