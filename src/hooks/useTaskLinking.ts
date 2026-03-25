// src/hooks/use-task-linking.ts

import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Task, Standup } from '@/types';
import { fetchWithTimeout } from '../lib/fetchWithTimeout';

/* Hook for task detection and linking in standup form */

interface UseTaskLinkingOptions {
	standup: Partial<Standup>;
	enabled?: boolean;
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
}

export function useTaskLinking({ standup, enabled = true }: UseTaskLinkingOptions) {
	const [state, setState] = useState<TaskLinkingState>({
		detected: [],
		isDetecting: false,
		selected: [],
		showSuggestions: false,
		showPicker: false,
	});

	// Auto-detect tasks from commits
	const detectMutation = useMutation<DetectTasksResponse, Error, NonNullable<Standup['commits']>>({
		mutationFn: async (commits) => {
			const response = await fetchWithTimeout('/api/tasks/detect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					commits: commits.map(commit => ({ message: commit.commit.message })),
					repoFullName: standup.repoFullName,
				}),
			});
			
			if (!response.ok) throw new Error('Detection failed');
			return response.json() as Promise<DetectTasksResponse>;
		},
		onSuccess: (data) => {
			setState(prev => ({
				...prev,
				detected: data.resolved,
				showSuggestions: data.resolved.length > 0,
				// Auto-select explicit references
				selected: [
					...prev.selected,
					...data.autoLinked.filter(
						(t: Task) => !prev.selected.some(s => s.id === t.id)
					),
				],
			}));
		},
	});

	// Trigger detection when commits change
	useEffect(() => {
		if (enabled && standup.commits?.length) {
			detectMutation.mutate(standup.commits);
		}
	}, [standup.commits, enabled, detectMutation]);


	// Search for tasks manually

	const searchMutation = useMutation<SearchTasksResponse, Error, string>({
		mutationFn: async (query: string) => {
			const response = await fetchWithTimeout('/api/tasks/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query,
					source: 'github',
					repoFullName: standup.repoFullName,
				}),
			});
			
			if (!response.ok) throw new Error('Search failed');
			return response.json() as Promise<SearchTasksResponse>;
		},
	});

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

	const addFromSearch = useCallback((task: Task) => {
		setState(prev => ({
			...prev,
			selected: prev.selected.some(t => t.id === task.id)
				? prev.selected
				: [...prev.selected, task],
			showPicker: false,
		}));
	}, []);

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

	const suggestedSprint = state.selected.find(t => t.currentSprintId)?.currentSprintId;

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
		search: searchMutation.mutate,
		
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
		suggestedSprint,
	};
}