import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db/habitDb';
import {
	createTodo,
	getTodosForDate,
	getAllTodos,
	toggleTodo,
	deleteTodo,
	todosInWeekOf,
} from './todoService';
import { getLocalDateKey } from '../utils/dateHelpers';

const JUN_3 = new Date(2024, 5, 3);

describe('todos', () => {
	beforeEach(async () => {
		await db.open();
		await db.todos.clear();
	});

	it('stores the due date as a local date key', async () => {
		const id = await createTodo({ userId: 1, title: 'Pick up parcel', dueDate: JUN_3 });
		const todo = await db.todos.get(id);

		expect(todo.dueDate).toBe('2024-06-03');
		expect(todo.completedOn).toBeNull();
	});

	it('finds todos by the day they are due', async () => {
		await createTodo({ userId: 1, title: 'Parcel', dueDate: JUN_3 });
		await createTodo({ userId: 1, title: 'Dentist', dueDate: new Date(2024, 5, 4) });

		const monday = await getTodosForDate(1, JUN_3);
		expect(monday.map(t => t.title)).toEqual(['Parcel']);
	});

	it('keeps one profile’s todos out of another’s', async () => {
		await createTodo({ userId: 1, title: 'Mine', dueDate: JUN_3 });
		await createTodo({ userId: 2, title: 'Theirs', dueDate: JUN_3 });

		expect((await getAllTodos(1)).map(t => t.title)).toEqual(['Mine']);
	});

	it('toggles done and back', async () => {
		const id = await createTodo({ userId: 1, title: 'Parcel', dueDate: JUN_3 });

		await toggleTodo(id, JUN_3);
		expect((await db.todos.get(id)).completedOn).toBe('2024-06-03');

		await toggleTodo(id, JUN_3);
		expect((await db.todos.get(id)).completedOn).toBeNull();
	});

	it('does not move an unfinished todo off its due date', async () => {
		// A todo that follows you forward can never be missed, which would make
		// the weekly success rate meaningless.
		const id = await createTodo({ userId: 1, title: 'Parcel', dueDate: JUN_3 });
		const later = new Date(2024, 5, 10);

		expect(await getTodosForDate(1, later)).toHaveLength(0);
		expect((await db.todos.get(id)).dueDate).toBe('2024-06-03');
	});

	it('deletes', async () => {
		const id = await createTodo({ userId: 1, title: 'Parcel', dueDate: JUN_3 });
		await deleteTodo(id);
		expect(await db.todos.get(id)).toBeUndefined();
	});

	it('refuses a todo with no title or no date', async () => {
		await expect(createTodo({ userId: 1, dueDate: JUN_3 })).rejects.toThrow();
		await expect(createTodo({ userId: 1, title: 'x' })).rejects.toThrow();
	});
});

describe('todosInWeekOf', () => {
	it('gathers the Monday-to-Sunday week around a date', () => {
		const todos = [
			{ dueDate: '2024-06-02' }, // Sunday before
			{ dueDate: '2024-06-03' }, // Monday
			{ dueDate: '2024-06-09' }, // Sunday
			{ dueDate: '2024-06-10' }, // next Monday
		];

		expect(todosInWeekOf(todos, new Date(2024, 5, 5))).toHaveLength(2);
	});
});

describe('v4 migration', () => {
	it('adds a todos table without disturbing habits', async () => {
		await db.open();
		await db.habits.clear();

		const habitId = await db.habits.add({
			userId: 1,
			name: 'Read',
			frequency: 'daily',
			startDate: new Date(),
			completions: ['2024-06-03'],
			pausedRanges: [],
		});

		await createTodo({ userId: 1, title: 'Parcel', dueDate: JUN_3 });

		expect((await db.habits.get(habitId)).completions).toEqual(['2024-06-03']);
		expect(getLocalDateKey(JUN_3)).toBe('2024-06-03');
		expect(await db.todos.count()).toBe(1);
	});
});

describe('due dates survive a western timezone', () => {
	beforeEach(async () => {
		await db.open();
		await db.todos.clear();
	});

	it('stores the day you picked, not the day before', async () => {
		// The form hands createTodo a 'YYYY-MM-DD' string, which used to be
		// re-parsed as UTC midnight and land a day early west of Greenwich.
		const id = await createTodo({ userId: 1, title: 'Parcel', dueDate: '2026-09-18' });
		expect((await db.todos.get(id)).dueDate).toBe('2026-09-18');
	});

	it('shows up on the day it was set for', async () => {
		await createTodo({ userId: 1, title: 'Parcel', dueDate: '2026-09-18' });

		expect(await getTodosForDate(1, new Date(2026, 8, 17))).toHaveLength(0);
		expect(await getTodosForDate(1, new Date(2026, 8, 18))).toHaveLength(1);
	});
});
