import { getLocalDateKey, generateDateOffset } from '../utils/dateHelpers';
import { habitsForDay } from './dayStatus';

export const UPCOMING_DAYS = 7;

/**
 * What is coming up over the next few days.
 *
 * Built from one read of habits and one of todos rather than a query per day,
 * and days with nothing on them are dropped — a list of empty headings tells
 * you nothing. Today itself is excluded; it has the rest of the screen.
 */
export function getUpcoming(habits, todos, today = new Date(), days = UPCOMING_DAYS) {
	const result = [];

	for (let offset = 1; offset <= days; offset++) {
		const date = generateDateOffset(today, offset);
		const dateKey = getLocalDateKey(date);

		const dayTodos = todos.filter(todo => todo.dueDate === dateKey && !todo.completedOn);
		const dayHabits = habitsForDay(habits, date);

		if (dayTodos.length === 0 && dayHabits.length === 0) continue;

		result.push({ date, dateKey, todos: dayTodos, habits: dayHabits });
	}

	return result;
}
