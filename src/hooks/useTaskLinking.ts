import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Task, Standup } from "@/types";
import { fetchWithTimeout } from '../lib/fetchWithTimeout';
import { handleApiResponse } from '../lib/errors';
import { useStore } from '../store';

/* Hook for task detection and linking in standup form */

interface UseTaskLinkingOptions {
	standup: Partial<Standup>;
	enabled?: boolean;
	initialSelected?: Task[];
}

interface DetectedTask extends Task {
	confidence: 'explicit' | 'inferred';
	raw: string;
}

interface TaskLinkingState {
	// Detection results
	detected: DetectedTask[];
	isDetecting: boolean;
	
	// Selected tasks (user confirmed)
	selected: Task[];
	
	// UI state
	showSuggestions: boolean;
	showPicker: boolean;
}

interface DetectTasksResponse {
	resolved: DetectedTask[];
	autoLinked: Task[];
}

interface SearchTasksResponse {
	tasks: Task[];
	error?: string;
}

interface ResolveTaskResponse {
	task: Task;
}

export function useTaskLinking({ standup, enabled = true, initialSelected = [] }: UseTaskLinkingOptions) {
	const user = useStore((state) => state.user)!;
	const [state, setState] = useState<TaskLinkingState>({
		detected: [],
		isDetecting: false,
		selected: initialSelected,
		showSuggestions: false,
		showPicker: false,
	});
	const [source, setSourceState] = useState<'github' | 'jira'>('github');

	// Auto-detect tasks from commits
	const detectMutation = useMutation<DetectTasksResponse, Error, NonNullable<Standup['commits']>>({
		retry: false,
		mutationFn: async (commits) => {
			const response = await fetchWithTimeout(`/api/tasks?userId=${user.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'detect',
					commits: commits.map(commit => ({ message: commit.commit.message })),
					repoFullName: standup.repoFullName,
				}),
			});
			
			return handleApiResponse<DetectTasksResponse>(response);
		},
		onSuccess: (data) => {
			const resolved = data?.resolved ?? [];
			const autoLinked = data?.autoLinked ?? [];
			setState(prev => ({
				...prev,
				detected: resolved,
				showSuggestions: resolved.length > 0,
				// Auto-select explicit references
				selected: [
					...prev.selected,
					...autoLinked.filter(
						(t: Task) => !prev.selected.some(s => s.id === t.id)
					),
				],
			}));
		},
	});

	const detectMutate = detectMutation.mutate;

	// Trigger detection when commits change
	useEffect(() => {
		if (enabled && standup.commits?.length && standup.repoFullName) {
			detectMutate(standup.commits);
		}
	}, [standup.commits, enabled, detectMutate, standup.repoFullName]);


	// Search for tasks manually

	const searchMutation = useMutation<SearchTasksResponse, Error, { query: string; source: 'github' | 'jira' }>({
		mutationFn: async ({ query, source: searchSource }) => {
			resolveMutation.reset();
			const body: Record<string, unknown> = { action: 'search', query, source: searchSource };
			if (searchSource === 'github') body.repoFullName = standup.repoFullName;
			const response = await fetchWithTimeout(`/api/tasks?userId=${user.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			return handleApiResponse<SearchTasksResponse>(response);
		},
	});

	const search = useCallback((query: string) => {
		searchMutation.mutate({ query, source });
	}, [searchMutation.mutate, source]);

	const setSource = useCallback((newSource: 'github' | 'jira') => {
		setSourceState(newSource);
		searchMutation.reset();
	}, [searchMutation.reset]);

	// Actions
	const confirmTask = useCallback((task: Task) => {
		setState(prev => ({
			...prev,
			selected: prev.selected.some(t => t.id === task.id)
				? prev.selected
				: [...prev.selected, task],
			detected: prev.detected.filter(t => t.id !== task.id),
			showSuggestions: prev.detected.filter(t => t.id !== task.id).length > 0,
		}));
	}, []);

	const confirmAll = useCallback(() => {
		setState(prev => ({
			...prev,
			selected: [
				...prev.selected,
				...prev.detected.filter(d => !prev.selected.some(s => s.id === d.id)),
			],
			detected: [],
			showSuggestions: false,
		}));
	}, []);

	const dismissTask = useCallback((taskId: string) => {
		setState(prev => ({
			...prev,
			detected: prev.detected.filter(t => t.id !== taskId),
			showSuggestions: prev.detected.filter(t => t.id !== taskId).length > 0,
		}));
	}, []);

	const dismissAll = useCallback(() => {
		setState(prev => ({
			...prev,
			detected: [],
			showSuggestions: false,
		}));
	}, []);

	const removeSelected = useCallback((taskId: string) => {
		setState(prev => ({
			...prev,
			selected: prev.selected.filter(t => t.id !== taskId),
		}));
	}, []);

	const resolveMutation = useMutation<ResolveTaskResponse, Error, Task>({
		retry: false,
		mutationFn: async (task: Task) => {
			const response = await fetchWithTimeout(`/api/tasks?userId=${user.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'resolve',
					externalId: task.externalId,
					source: task.externalSource,
					repoFullName: standup.repoFullName,
				}),
			});
			return handleApiResponse<ResolveTaskResponse>(response);
		},
		onSuccess: (data) => {
			setState(prev => ({
				...prev,
				selected: prev.selected.some(t => t.id === data.task.id)
					? prev.selected
					: [...prev.selected, data.task],
				showPicker: false,
			}));
		},
	});

	const addFromSearch = resolveMutation.mutate;

	const openPicker = useCallback(() => {
		setState(prev => ({ ...prev, showPicker: true }));
	}, []);

	const closePicker = useCallback(() => {
		setState(prev => ({ ...prev, showPicker: false }));
	}, []);

	// Computed values
	const totalPoints = state.selected.reduce(
		(sum, task) => sum + (task.storyPoints || 0),
		0
	);


	return {
		// State
		detected: state.detected,
		selected: state.selected,
		isDetecting: detectMutation.isPending,
		showSuggestions: state.showSuggestions,
		showPicker: state.showPicker,
		
		// Search
		searchResults: searchMutation.data?.tasks || [],
		isSearching: searchMutation.isPending,
		searchError: searchMutation.error?.message || null,
		search,
		source,
		setSource,

		// Resolve (persisting a search result as a real task)
		isResolving: resolveMutation.isPending,
		resolveError: resolveMutation.error?.message || null,
		resolvingTaskId: resolveMutation.variables?.externalId || null,

		// Actions
		confirmTask,
		confirmAll,
		dismissTask,
		dismissAll,
		removeSelected,
		addFromSearch,
		openPicker,
		closePicker,
		
		// Computed
		totalPoints,
	};
}