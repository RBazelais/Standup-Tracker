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
		<Card className="p-6 backdrop-blur transition-all text-left bg-surface-raised/30 border-border hover:bg-surface-raised/50">
			<div className="flex items-center gap-3 mb-3">
				{icon}
				<h3 className="text-lg font-semibold text-text">{title}</h3>
			</div>
			<p className="text-sm leading-relaxed text-text-subtle">{description}</p>
		</Card>
	);
}
