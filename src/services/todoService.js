import { db } from '../db/habitDb';
import { getLocalDateKey, getStartOfWeek } from '../utils/dateHelpers';

/**
 * Todos are stored against a local date key, the same as habit completions, so
 * nothing in the app has to reason about times or UTC offsets.
 *
 * An unfinished todo stays on the day it was due rather than following you
 * forward. A rolling todo can never be missed, which would make the weekly
 * success rate meaningless.
 */
export async function createTodo({ userId, title, dueDate, details = '' }) {
	if (!userId || !title || !dueDate) {
		throw new Error('User ID, title and a due date are required');
	}

	return await db.todos.add({
		userId,
		title: title.trim(),
		details,
		dueDate: getLocalDateKey(dueDate),
		completedOn: null,
		createdAt: getLocalDateKey(new Date()),
	});
}

export async function getTodosForDate(userId, date) {
	if (!userId) throw new Error('User ID is required');

	return await db.todos
		.where('userId')
		.equals(userId)
		.and(todo => todo.dueDate === getLocalDateKey(date))
		.toArray();
}

export async function getAllTodos(userId) {
	if (!userId) throw new Error('User ID is required');
	return await db.todos.where('userId').equals(userId).toArray();
}

export function todosInWeekOf(todos, date) {
	const weekStart = getStartOfWeek(date);
	const keys = new Set();

	for (let i = 0; i < 7; i++) {
		const day = new Date(weekStart);
		day.setDate(weekStart.getDate() + i);
		keys.add(getLocalDateKey(day));
	}

	return todos.filter(todo => keys.has(todo.dueDate));
}

export async function toggleTodo(id, on = new Date()) {
	await db.transaction('rw', db.todos, async () => {
		const todo = await db.todos.get(id);
		if (!todo) return;

		await db.todos.update(id, {
			completedOn: todo.completedOn ? null : getLocalDateKey(on),
		});
	});
}

export async function updateTodo(id, updates) {
	if (!id) throw new Error('Todo ID is required');
	return await db.todos.update(id, updates);
}

export async function deleteTodo(id) {
	if (!id) throw new Error('Todo ID is required');
	return await db.todos.delete(id);
}
