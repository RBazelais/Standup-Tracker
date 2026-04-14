import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import {
	getTodayRange,
	getYesterdayRange,
	getThisWeekRange,
	getLastFridayRange,
	getLastWeekRange,
	getToday,
} from "../utils/dateUtils";

export type Preset = "today" | "yesterday" | "thisWeek" | "lastFriday" | "lastWeek";

interface DateRangePresetsProps {
	startDate: string;
	endDate: string;
	activePreset: Preset | null;
	onRangeChange: (start: string, end: string, preset: Preset | null) => void;
}

const PRESETS: { id: Preset; label: string; getRange: () => { start: string; end: string } }[] = [
	{ id: "today", label: "Today", getRange: getTodayRange },
	{ id: "yesterday", label: "Yesterday", getRange: getYesterdayRange },
	{ id: "thisWeek", label: "This Week", getRange: getThisWeekRange },
	{ id: "lastFriday", label: "Last Friday", getRange: getLastFridayRange },
	{ id: "lastWeek", label: "Last Week", getRange: getLastWeekRange },
];

export function DateRangePresets({
	startDate,
	endDate,
	activePreset,
	onRangeChange,
}: DateRangePresetsProps) {
	return (
		<div>
			<div className="flex items-center gap-2 mb-3">
				<Calendar className="h-4 w-4 text-foreground-muted" />
				<Label className="text-foreground-muted text-sm">
					Fetch commits from:
				</Label>
			</div>

			{/* Quick Presets */}
			<div className="flex flex-wrap gap-2 mb-3">
				{PRESETS.map(({ id, label, getRange }) => (
					<Button
						key={id}
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => {
							const range = getRange();
							onRangeChange(range.start, range.end, id);
						}}
						className={`text-xs border border-border ${
							activePreset === id
								? "bg-accent text-white"
								: "bg-surface-overlay text-foreground-muted hover:bg-accent hover:text-white"
						} active:scale-95`}
					>
						{label}
					</Button>
				))}
			</div>

			{/* Custom Date Inputs */}
			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1">
					<Label htmlFor="start-date" className="text-xs text-foreground-muted">
						Start Date
					</Label>
					<Input
						id="start-date"
						type="date"
						value={startDate}
						onChange={(e) => onRangeChange(e.target.value, endDate, null)}
						className="bg-surface-overlay border-border text-foreground text-sm"
					/>
				</div>

				<div className="space-y-1">
					<Label htmlFor="end-date" className="text-xs text-foreground-muted">
						End Date
					</Label>
					<Input
						id="end-date"
						type="date"
						value={endDate}
						onChange={(e) => onRangeChange(startDate, e.target.value, null)}
						max={getToday()}
						className="bg-surface-overlay border-border text-foreground text-sm"
					/>
				</div>
			</div>
		</div>
	);
}
