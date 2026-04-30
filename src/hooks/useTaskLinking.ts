import { useReducer, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Task, Standup } from "@/types";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleApiResponse } from "../lib/errors";
import { useStore } from "../store";

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
	detected: DetectedTask[];
	selected: Task[];
	showSuggestions: boolean;
}

type Action =
	| { type: 'DETECT_SUCCESS'; resolved: DetectedTask[]; autoLinked: Task[] }
	| { type: 'CONFIRM_TASK'; task: Task }
	| { type: 'CONFIRM_ALL' }
	| { type: 'DISMISS_TASK'; taskId: string }
	| { type: 'DISMISS_ALL' }
	| { type: 'REMOVE_SELECTED'; taskId: string }
	| { type: 'RESOLVE_SUCCESS'; task: Task };

function reducer(state: TaskLinkingState, action: Action): TaskLinkingState {
	switch (action.type) {
		case 'DETECT_SUCCESS': {
			const { resolved, autoLinked } = action;
			return {
				...state,
				detected: resolved,
				showSuggestions: resolved.length > 0,
				selected: [
					...state.selected,
					...autoLinked.filter(t => !state.selected.some(s => s.id === t.id)),
				],
			};
		}
		case 'CONFIRM_TASK': {
			const remaining = state.detected.filter(t => t.id !== action.task.id);
			return {
				...state,
				selected: state.selected.some(t => t.id === action.task.id)
					? state.selected
					: [...state.selected, action.task],
				detected: remaining,
				showSuggestions: remaining.length > 0,
			};
		}
		case 'CONFIRM_ALL':
			return {
				...state,
				selected: [
					...state.selected,
					...state.detected.filter(d => !state.selected.some(s => s.id === d.id)),
				],
				detected: [],
				showSuggestions: false,
			};
		case 'DISMISS_TASK': {
			const remaining = state.detected.filter(t => t.id !== action.taskId);
			return { ...state, detected: remaining, showSuggestions: remaining.length > 0 };
		}
		case 'DISMISS_ALL':
			return { ...state, detected: [], showSuggestions: false };
		case 'REMOVE_SELECTED':
			return { ...state, selected: state.selected.filter(t => t.id !== action.taskId) };
		case 'RESOLVE_SUCCESS':
			return {
				...state,
				selected: state.selected.some(t => t.id === action.task.id)
					? state.selected
					: [...state.selected, action.task],
			};
		default:
			return state;
	}
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
	const [state, dispatch] = useReducer(reducer, {
		detected: [],
		selected: initialSelected,
		showSuggestions: false,
	});

	const detectMutation = useMutation<DetectTasksResponse, Error, NonNullable<Standup['commits']>>({
		retry: false,
		mutationFn: async (commits) => {
			const response = await fetchWithTimeout(`/api/tasks/actions?userId=${user.id}`, {
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
			dispatch({
				type: 'DETECT_SUCCESS',
				resolved: data?.resolved ?? [],
				autoLinked: data?.autoLinked ?? [],
			});
		},
	});

	const detectMutate = detectMutation.mutate;

	useEffect(() => {
		if (enabled && standup.commits?.length && standup.repoFullName) {
			detectMutate(standup.commits);
		}
	}, [standup.commits, enabled, detectMutate, standup.repoFullName]);

	const searchMutation = useMutation<SearchTasksResponse, Error, string>({
		mutationFn: async (query: string) => {
			resolveMutation.reset();
			const response = await fetchWithTimeout(`/api/tasks/actions?userId=${user.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'search',
					query,
					source: 'github',
					repoFullName: standup.repoFullName,
				}),
			});
			return handleApiResponse<SearchTasksResponse>(response);
		},
	});

	const resolveMutation = useMutation<ResolveTaskResponse, Error, Task>({
		retry: false,
		mutationFn: async (task: Task) => {
			const response = await fetchWithTimeout(`/api/tasks/actions?userId=${user.id}`, {
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
			dispatch({ type: 'RESOLVE_SUCCESS', task: data.task });
		},
	});

	const confirmTask = useCallback((task: Task) => {
		dispatch({ type: 'CONFIRM_TASK', task });
	}, []);

	const confirmAll = useCallback(() => {
		dispatch({ type: 'CONFIRM_ALL' });
	}, []);

	const dismissTask = useCallback((taskId: string) => {
		dispatch({ type: 'DISMISS_TASK', taskId });
	}, []);

	const dismissAll = useCallback(() => {
		dispatch({ type: 'DISMISS_ALL' });
	}, []);

	const removeSelected = useCallback((taskId: string) => {
		dispatch({ type: 'REMOVE_SELECTED', taskId });
	}, []);

	const totalPoints = state.selected.reduce(
		(sum, task) => sum + (task.storyPoints || 0),
		0
	);

	return {
		detected: state.detected,
		selected: state.selected,
		isDetecting: detectMutation.isPending,
		showSuggestions: state.showSuggestions,

		searchResults: searchMutation.data?.tasks || [],
		isSearching: searchMutation.isPending,
		searchError: searchMutation.error?.message || null,
		search: searchMutation.mutate,

		isResolving: resolveMutation.isPending,
		resolveError: resolveMutation.error?.message || null,
		resolvingTaskId: resolveMutation.variables?.externalId || null,

		confirmTask,
		confirmAll,
		dismissTask,
		dismissAll,
		removeSelected,
		addFromSearch: resolveMutation.mutate,

		totalPoints,
	};
}
