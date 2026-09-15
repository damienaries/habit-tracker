import { useMutation, useQueryClient } from '@tanstack/react-query';
import { habitKeys } from '../queries/habitKeys';
import { createHabit, updateHabit } from '../services/habitService';
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
