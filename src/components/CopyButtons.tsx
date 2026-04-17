import { Copy, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatters } from "@/lib/formatters";
import type { FormatType } from "@/lib/formatters";
import type { Standup } from "@/types";

const FORMAT_LABELS: Record<FormatType, string> = {
	plain: "Plain text",
	slack: "Slack",
	jira: "Jira",
	markdown: "Markdown",
};

interface CopyButtonsProps {
	standup: Standup;
}

export function CopyButtons({ standup }: CopyButtonsProps) {
	const handleCopy = async (format: FormatType) => {
		const text = formatters[format]({ standup });
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`Copied as ${FORMAT_LABELS[format]}`);
		} catch {
			toast.error("Failed to copy");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="bg-surface-raised border-border hover:bg-surface-overlay text-foreground-muted hover:text-foreground"
				>
					<Copy className="h-4 w-4 mr-2" aria-hidden="true" />
					Copy
					<ChevronDown className="h-3 w-3 ml-1" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{(Object.keys(formatters) as FormatType[]).map((format) => (
					<DropdownMenuItem key={format} onSelect={() => handleCopy(format)}>
						{FORMAT_LABELS[format]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
