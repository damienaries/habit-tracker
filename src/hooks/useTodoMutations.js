import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoKeys } from '../queries/todoKeys';
import { createTodo, toggleTodo, updateTodo, deleteTodo } from '../services/todoService';

function useTodoMutation(mutationFn) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
	});
}

export function useCreateTodo() {
	return useTodoMutation(createTodo);
}

export function useToggleTodo() {
	return useTodoMutation(({ id }) => toggleTodo(id));
}

export function useUpdateTodo() {
	return useTodoMutation(({ id, updates }) => updateTodo(id, updates));
}

export function useDeleteTodo() {
	return useTodoMutation(({ id }) => deleteTodo(id));
}
