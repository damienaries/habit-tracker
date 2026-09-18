import { getLocalDateKey, getStartOfWeek, isSameDay } from '../utils/dateHelpers';
import { shouldAppearOn } from './schedule';

export function completionsInWeekOf(habit, date) {
	const weekStart = getStartOfWeek(date);
	const keys = new Set();

	for (let i = 0; i < 7; i++) {
		const day = new Date(weekStart);
		day.setDate(weekStart.getDate() + i);
		keys.add(getLocalDateKey(day));
	}

	return (habit.completions || []).filter(key => keys.has(key)).length;
}

// Which of these habits belong on this day's card.
export function habitsForDay(habits, date) {
	return habits.filter(habit => shouldAppearOn(habit, date, completionsInWeekOf(habit, date)));
}

/**
 * Everything planned for a day, in the order it should be read: errands first,
 * then habits. One entry per bullet on the week view.
 */
export function getDayItems(habits, date, todos = []) {
	const dateKey = getLocalDateKey(date);

	const todoItems = todos
		.filter(todo => todo.dueDate === dateKey)
		.map(todo => ({
			id: `todo-${todo.id}`,
			kind: 'todo',
			label: todo.title,
			done: Boolean(todo.completedOn),
		}));

	const habitItems = habitsForDay(habits, date).map(habit => ({
		id: `habit-${habit.id}`,
		kind: 'habit',
		label: habit.name,
		done: (habit.completions || []).includes(dateKey),
	}));

	return [...todoItems, ...habitItems];
}

/**
 * How much of a day got done, as a fraction.
 *
 * Every habit shown on the day counts toward the total — including flexible
 * weekly ones. An earlier version judged only the habits strictly *due* that
 * date, which meant a day showing two of three ticks reported itself as
 * complete. The denominator has to be the one you can see.
 *
 * Returns a ratio rather than a status word so the calendar can shade by
 * degree: three buckets threw away the difference between one of four and
 * three of four.
 *
 * Todos count too when they are passed in — ticking everything you planned for
 * a day should read as a full day whether it was a habit or an errand.
 */
export function getDayProgress(habits, date, today = new Date(), todos = []) {
	const onThisDay = habitsForDay(habits, date);
	const dateKey = getLocalDateKey(date);
	const dayTodos = todos.filter(todo => todo.dueDate === dateKey);

	const total = onThisDay.length + dayTodos.length;
	const done =
		onThisDay.filter(habit => (habit.completions || []).includes(dateKey)).length +
		dayTodos.filter(todo => Boolean(todo.completedOn)).length;

	const isToday = isSameDay(date, today);
	const isFuture = !isToday && date > today;

	let state = 'past';
	if (total === 0) state = 'empty';
	else if (isFuture) state = 'future';
	else if (isToday) state = 'today';

	return {
		done,
		total,
		ratio: total === 0 ? 0 : done / total,
		complete: total > 0 && done === total,
		state,
	};
}
