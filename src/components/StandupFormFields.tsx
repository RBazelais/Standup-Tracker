import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface StandupFormFieldsProps {
	workCompleted: string;
	workPlanned: string;
	blockers: string;
	onWorkCompletedChange: (value: string) => void;
	onWorkPlannedChange: (value: string) => void;
	onBlockersChange: (value: string) => void;
}

export function StandupFormFields({
	workCompleted,
	workPlanned,
	blockers,
	onWorkCompletedChange,
	onWorkPlannedChange,
	onBlockersChange,
}: StandupFormFieldsProps) {
	return (
		<>
			<div className="space-y-2">
				<Label htmlFor="workCompleted" className="text-foreground-muted">
					Completed
				</Label>
				<Textarea
					id="workCompleted"
					value={workCompleted}
					onChange={(e) => onWorkCompletedChange(e.target.value)}
					placeholder="What did you work on during this period?"
					className="bg-surface-overlay border-border text-foreground placeholder:text-foreground-muted min-h-[100px] focus:bg-surface-raised"
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="workPlanned" className="text-foreground-muted">
					Planned
				</Label>
				<Textarea
					id="workPlanned"
					value={workPlanned}
					onChange={(e) => onWorkPlannedChange(e.target.value)}
					placeholder="What will you work on next?"
					className="bg-surface-overlay border-border text-foreground placeholder:text-foreground-muted min-h-[100px] focus:bg-surface-raised"
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="blockers" className="text-foreground-muted">
					Blockers
				</Label>
				<Textarea
					id="blockers"
					value={blockers}
					onChange={(e) => onBlockersChange(e.target.value)}
					placeholder="Any blockers? (Optional)"
					className="bg-surface-overlay border-border text-foreground placeholder:text-foreground-muted min-h-[80px] focus:bg-surface-raised"
				/>
			</div>
		</>
	);
}
