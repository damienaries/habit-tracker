import { useMutation, useQueryClient } from '@tanstack/react-query';
import { habitKeys } from '../queries/habitKeys';
import {
	createHabit,
	updateHabit,
	pauseHabit,
	resumeHabit,
	endHabit,
	reopenHabit,
	deleteHabit,
} from '../services/habitService';
import { toggleHabitCompletion } from '../db/habitDb';

// Every habit write goes through one of these hooks. Writing to Dexie directly
// leaves the cache holding pre-write data, so the UI only catches up on reload.
function useHabitMutation(mutationFn) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
	});
}

export function useCreateHabit() {
	return useHabitMutation(createHabit);
}

export function useUpdateHabit() {
	return useHabitMutation(({ id, updates }) => updateHabit(id, updates));
}

export function useToggleHabitCompletion() {
	return useHabitMutation(({ habit, date }) => toggleHabitCompletion(habit, date));
}

export function usePauseHabit() {
	return useHabitMutation(({ id }) => pauseHabit(id));
}

export function useResumeHabit() {
	return useHabitMutation(({ id }) => resumeHabit(id));
}

export function useEndHabit() {
	return useHabitMutation(({ id, reason }) => endHabit(id, reason));
}

export function useReopenHabit() {
	return useHabitMutation(({ id }) => reopenHabit(id));
}

export function useDeleteHabit() {
	return useHabitMutation(({ id }) => deleteHabit(id));
}
