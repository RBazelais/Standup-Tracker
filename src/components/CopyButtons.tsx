import { useRef, useState } from "react";
import { Copy, ChevronDown } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatters, type FormatType } from "@/lib/formatters";
import type { Standup } from "@/types";

const FORMAT_ORDER: FormatType[] = ["plain", "slack", "jira", "markdown"];

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
	const [fallbackText, setFallbackText] = useState<string | null>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	const handleCopy = async (format: FormatType) => {
		const text = formatters[format]({ standup });
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`Copied as ${FORMAT_LABELS[format]}`);
		} catch {
			setFallbackText(text);
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						ref={triggerRef}
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
					{FORMAT_ORDER.map((format) => (
						<DropdownMenuItem key={format} onSelect={() => handleCopy(format)}>
							{FORMAT_LABELS[format]}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={fallbackText !== null} onOpenChange={(open) => !open && setFallbackText(null)}>
				<DialogContent onCloseAutoFocus={(e) => { e.preventDefault(); triggerRef.current?.focus(); }}>
					<DialogHeader>
						<DialogTitle>Copy to clipboard</DialogTitle>
						<DialogDescription>
							Clipboard access was denied. Select all and copy manually.
						</DialogDescription>
					</DialogHeader>
					<textarea
						className="w-full h-48 p-3 text-sm font-mono bg-surface-overlay border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-accent"
						readOnly
						value={fallbackText ?? ""}
						onFocus={(e) => e.target.select()}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}
