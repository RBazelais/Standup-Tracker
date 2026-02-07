import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { standupsApi } from "../services/api";
import { useStore } from "../store";
import { toast } from "sonner";
import { getErrorMessage } from "../lib/errors";
import type { Standup } from "../types";

export function useStandups() {
	const user = useStore((state) => state.user);
	const queryClient = useQueryClient();

	const {
		data: standups = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["standups", user?.id],
		queryFn: () => standupsApi.getAll(user!.id.toString()),
		enabled: !!user,
	});

	const createMutation = useMutation({
		mutationFn: (standup: Omit<Standup, "id" | "createdAt">) =>
			standupsApi.create(user!.id.toString(), standup),

		onMutate: async (newStandup) => {
			await queryClient.cancelQueries({
				queryKey: ["standups", user?.id],
			});
			const previousStandups = queryClient.getQueryData<Standup[]>([
				"standups",
				user?.id,
			]);

			queryClient.setQueryData<Standup[]>(
				["standups", user?.id],
				(old = []) => [
					{
						...newStandup,
						id: crypto.randomUUID(),
						createdAt: new Date().toISOString(),
					} as Standup,
					...old,
				],
			);

			return { previousStandups };
		},

		onError: (err, _newStandup, context) => {
			if (context?.previousStandups) {
				queryClient.setQueryData(
					["standups", user?.id],
					context.previousStandups,
				);
			}
			toast.error(getErrorMessage(err));
		},

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["standups", user?.id] });
			toast.success("Standup created!");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<Standup>;
		}) => standupsApi.update(id, updates),

		onMutate: async ({ id, updates }) => {
			await queryClient.cancelQueries({
				queryKey: ["standups", user?.id],
			});
			const previousStandups = queryClient.getQueryData<Standup[]>([
				"standups",
				user?.id,
			]);

			queryClient.setQueryData<Standup[]>(
				["standups", user?.id],
				(old = []) =>
					old.map((s) => (s.id === id ? { ...s, ...updates } : s)),
			);

			return { previousStandups };
		},

		onError: (err, _variables, context) => {
			if (context?.previousStandups) {
				queryClient.setQueryData(
					["standups", user?.id],
					context.previousStandups,
				);
			}
			toast.error(getErrorMessage(err));
		},

		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["standups", user?.id] });
			queryClient.invalidateQueries({ queryKey: ["standup", id] });
			toast.success("Standup updated!");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => standupsApi.delete(id),

		onMutate: async (id) => {
			await queryClient.cancelQueries({
				queryKey: ["standups", user?.id],
			});
			const previousStandups = queryClient.getQueryData<Standup[]>([
				"standups",
				user?.id,
			]);

			queryClient.setQueryData<Standup[]>(
				["standups", user?.id],
				(old = []) => old.filter((s) => s.id !== id),
			);

			return { previousStandups };
		},

		onError: (err, _id, context) => {
			if (context?.previousStandups) {
				queryClient.setQueryData(
					["standups", user?.id],
					context.previousStandups,
				);
			}
			toast.error(getErrorMessage(err));
		},

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["standups", user?.id] });
			toast.success("Standup deleted!");
		},
	});

	return {
		standups,
		isLoading,
		error,
		createStandup: createMutation.mutate,
		updateStandup: updateMutation.mutate,
		deleteStandup: deleteMutation.mutate,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
}
