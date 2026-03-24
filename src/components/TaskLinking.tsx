// src/components/standup/task-linking.tsx

import { useEffect, useState } from 'react';
import { 
	Plus, 
	X, 
	Check, 
	Search, 
	ExternalLink,
	GitBranch,
	AlertCircle,
	Loader2,
} from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTaskLinking } from '@/hooks/useTaskLinking';
import type { Task, Standup } from '@/types';

// MAIN COMPONENT

interface TaskLinkingSectionProps {
	standup: Partial<Standup>;
	onTasksChange: (taskIds: string[]) => void;
}

export function TaskLinkingSection({ standup, onTasksChange }: TaskLinkingSectionProps) {
	const {
		detected,
		selected,
		isDetecting,
		showSuggestions,
		showPicker,
		searchResults,
		isSearching,
		search,
		confirmTask,
		confirmAll,
		dismissTask,
		dismissAll,
		removeSelected,
		addFromSearch,
		openPicker,
		closePicker,
		totalPoints,
	} = useTaskLinking({ standup });

	// Update parent when selected tasks change
	useEffect(() => {
		onTasksChange(selected.map(t => t.id));
	}, [selected, onTasksChange]);

	return (
		<div className="space-y-4">
			{/* Section Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
					<GitBranch className="h-4 w-4" />
					Linked Issues
					{totalPoints > 0 && (
						<Badge variant="secondary" className="ml-2">
							{totalPoints} pts
						</Badge>
					)}
				</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={openPicker}
					className="gap-1"
				>
					<Plus className="h-4 w-4" />
					Link Issue
				</Button>
			</div>

			{/* Detection Loading State */}
			{isDetecting && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 className="h-4 w-4 animate-spin" />
					Scanning commits for issue references...
				</div>
			)}

			{/* Suggestions Banner */}
			{showSuggestions && detected.length > 0 && (
				<TaskSuggestionsBanner
					tasks={detected}
					onConfirm={confirmTask}
					onConfirmAll={confirmAll}
					onDismiss={dismissTask}
					onDismissAll={dismissAll}
				/>
			)}

			{/* Selected Tasks List */}
			{selected.length > 0 ? (
				<div className="space-y-2">
					{selected.map(task => (
						<LinkedTaskCard
							key={task.id}
							task={task}
							onRemove={() => removeSelected(task.id)}
						/>
					))}
				</div>
			) : (
				<div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
					No linked issues yet
				</div>
			)}

			{/* Issue Picker Modal */}
			<IssuePickerDialog
				open={showPicker}
				onOpenChange={closePicker}
				searchResults={searchResults}
				isSearching={isSearching}
				onSearch={search}
				onSelect={addFromSearch}
				selectedIds={selected.map(t => t.id)}
			/>
		</div>
	);
}

// SUGGESTIONS BANNER

interface TaskSuggestionsBannerProps {
	tasks: Task[];
	onConfirm: (task: Task) => void;
	onConfirmAll: () => void;
	onDismiss: (taskId: string) => void;
	onDismissAll: () => void;
}

function TaskSuggestionsBanner({
	tasks,
	onConfirm,
	onConfirmAll,
	onDismiss,
	onDismissAll,
}: TaskSuggestionsBannerProps) {
	return (
		<div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					<span className="text-sm font-medium text-blue-800 dark:text-blue-200">
						Found {tasks.length} issue{tasks.length > 1 ? 's' : ''} in your commits
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={onConfirmAll}
						className="text-blue-700 hover:text-blue-800 hover:bg-blue-100"
					>
						<Check className="h-4 w-4 mr-1" />
						Link All
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onDismissAll}
						className="text-blue-600 hover:text-blue-700"
					>
						Ignore
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				{tasks.map(task => (
					<div
						key={task.id}
						className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-md p-2"
					>
						<div className="flex items-center gap-2 min-w-0">
							<TaskStatusBadge status={task.status} />
							<span className="font-mono text-sm text-muted-foreground">
								{task.externalLinks?.[0]?.externalId}
							</span>
							<span className="text-sm truncate">{task.title}</span>
							{task.storyPoints && (
								<Badge variant="outline" className="ml-2 shrink-0">
									{task.storyPoints} pts
								</Badge>
							)}
						</div>
						<div className="flex items-center gap-1 shrink-0">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onConfirm(task)}
								className="h-7 w-7 p-0"
							>
								<Check className="h-4 w-4 text-green-600" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onDismiss(task.id)}
								className="h-7 w-7 p-0"
							>
								<X className="h-4 w-4 text-muted-foreground" />
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// LINKED TASK CARD

interface LinkedTaskCardProps {
	task: Task;
	onRemove: () => void;
}

function LinkedTaskCard({ task, onRemove }: LinkedTaskCardProps) {
	const externalLink = task.externalLinks?.[0];
	const externalId = externalLink?.externalId || task.externalId || 'Unlinked';
	const externalUrl = externalLink?.externalUrl || task.externalUrl;

	return (
		<div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 group">
			<div className="flex items-center gap-3 min-w-0">
				<TaskStatusBadge status={task.status} />
				
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						{externalUrl ? (
							<a
								href={externalUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
							>
								{externalId}
								<ExternalLink className="h-3 w-3" />
							</a>
						) : (
							<span className="font-mono text-sm text-muted-foreground">{externalId}</span>
						)}
						{task.storyPoints && (
							<Badge variant="outline">{task.storyPoints} pts</Badge>
						)}
						{task.rolloverCount && task.rolloverCount > 0 && (
							<Badge variant="destructive" className="text-xs">
								{task.rolloverCount}x rollover
							</Badge>
						)}
					</div>
					<p className="text-sm text-muted-foreground truncate">{task.title}</p>
				</div>
			</div>

			<Button
				variant="ghost"
				size="sm"
				onClick={onRemove}
				className="opacity-0 group-hover:opacity-100 transition-opacity"
			>
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
}

// ISSUE PICKER DIALOG

interface IssuePickerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	searchResults: Task[];
	isSearching: boolean;
	onSearch: (query: string) => void;
	onSelect: (task: Task) => void;
	selectedIds: string[];
}

function IssuePickerDialog({
	open,
	onOpenChange,
	searchResults,
	isSearching,
	onSearch,
	onSelect,
	selectedIds,
}: IssuePickerDialogProps) {
	const [query, setQuery] = useState('');

	const handleSearch = () => {
		if (query.trim()) {
			onSearch(query);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Link GitHub Issue</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search Input */}
					<div className="flex gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search issues by number or title..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
								className="pl-9"
							/>
						</div>
						<Button onClick={handleSearch} disabled={isSearching}>
							{isSearching ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								'Search'
							)}
						</Button>
					</div>

					{/* Results */}
					<div className="max-h-80 overflow-y-auto space-y-2">
						{searchResults.length === 0 && !isSearching && (
							<div className="text-center py-8 text-muted-foreground">
								Search for issues to link
							</div>
						)}

						{searchResults.map(task => {
							const isSelected = selectedIds.includes(task.id);
							const externalLink = task.externalLinks?.[0];

							return (
								<button
									key={task.id}
									onClick={() => !isSelected && onSelect(task)}
									disabled={isSelected}
									className={`
										w-full text-left p-3 rounded-lg border transition-colors
										${isSelected 
											? 'bg-muted/50 opacity-50 cursor-not-allowed' 
											: 'hover:bg-muted/50 cursor-pointer'}
									`}
								>
									<div className="flex items-center gap-2">
										<TaskStatusBadge status={task.status} />
										<span className="font-mono text-sm">
											{externalLink?.externalId}
										</span>
										{task.storyPoints && (
											<Badge variant="outline">{task.storyPoints} pts</Badge>
										)}
										{isSelected && (
											<Badge variant="secondary">Linked</Badge>
										)}
									</div>
									<p className="text-sm text-muted-foreground mt-1 truncate">
										{task.title}
									</p>
								</button>
							);
						})}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// STATUS BADGE

function TaskStatusBadge({ status }: { status: string }) {
	const config: Record<string, { color: string; label: string }> = {
		planned: { color: 'bg-gray-400', label: 'Planned' },
		in_progress: { color: 'bg-blue-500', label: 'In Progress' },
		in_review: { color: 'bg-purple-500', label: 'In Review' },
		done: { color: 'bg-green-500', label: 'Done' },
		backlog: { color: 'bg-yellow-500', label: 'Backlog' },
		blocked: { color: 'bg-red-500', label: 'Blocked' },
	};

	const { color } = config[status] || config.planned;

	return (
		<div className={`h-2 w-2 rounded-full ${color}`} title={status} />
	);
}