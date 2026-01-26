import { Card } from "@/components/ui/card";

interface FeatureCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
}

export function FeatureCard({
	icon,
	title,
	description,
}: FeatureCardProps) {
	return (
		<Card
			className="p-6 backdrop-blur transition-all text-left bg-slate-800/30 border-slate-700 hover:bg-slate-800/50"
		>
			<div className="flex items-center gap-3 mb-3">
				{icon}
				<h3 className="text-lg font-semibold text-white">
					{title}
				</h3>
			</div>
			<p className="text-sm leading-relaxed text-slate-400">
				{description}
			</p>
		</Card>
	);
}
