import { getStartOfWeek, getLocalDateKey, addWeeks, generateDateOffset } from '../utils/dateHelpers';
import { weeklyTarget } from './schedule';

export const HISTORY_WEEKS = 12;

function weekKeys(weekStart) {
	const keys = [];
	for (let i = 0; i < 7; i++) {
		const day = new Date(weekStart);
		day.setDate(weekStart.getDate() + i);
		keys.push(getLocalDateKey(day));
	}
	return keys;
}

/**
 * How much of a week's plan was met.
 *
 * Scored per week rather than by summing days: a flexible habit is offered on
 * every day until its target lands, so counting days would put it in the
 * denominator three or four times over. Completions past a habit's target are
 * capped, so an extra session cannot push a week above 100%.
 */
export function getWeekScore(habits, todos, weekStart) {
	const keys = new Set(weekKeys(weekStart));

	let planned = 0;
	let done = 0;

	for (const habit of habits) {
		const target = weeklyTarget(habit, weekStart);
		if (target === 0) continue;

		const hits = (habit.completions || []).filter(key => keys.has(key)).length;

		planned += target;
		done += Math.min(hits, target);
	}

	const weekTodos = todos.filter(todo => keys.has(todo.dueDate));
	planned += weekTodos.length;
	done += weekTodos.filter(todo => Boolean(todo.completedOn)).length;

	return { done, planned, ratio: planned === 0 ? 0 : done / planned };
}

export function getHabitScore(habit, today = new Date()) {
	const currentWeekStart = getStartOfWeek(today);
	const firstWeekStart = getStartOfWeek(new Date(habit.startDate));

	let planned = 0;
	let done = 0;
	let weeks = 0;

	for (
		const cursor = new Date(firstWeekStart);
		cursor < currentWeekStart;
		cursor.setDate(cursor.getDate() + 7)
	) {
		const target = weeklyTarget(habit, new Date(cursor));
		if (target === 0) continue;

		const keys = new Set(weekKeys(new Date(cursor)));
		const hits = (habit.completions || []).filter(key => keys.has(key)).length;

		planned += target;
		done += Math.min(hits, target);
		weeks += 1;
	}

	const start = new Date(habit.startDate);
	start.setHours(0, 0, 0, 0);
	const end = new Date(today);
	end.setHours(0, 0, 0, 0);

	return {
		planned,
		done,
		weeks,
		// Null rather than zero: a habit created this week has no record yet, and
		// showing it 0% would be a lie about a week still in progress.
		ratio: planned === 0 ? null : done / planned,
		daysTracked: Math.max(1, Math.round((end - start) / 86400000) + 1),
		totalDone: (habit.completions || []).length,
	};
}

export function getStats(habits, todos, today = new Date(), weeks = HISTORY_WEEKS) {
	const currentWeekStart = getStartOfWeek(today);

	const history = [];
	for (let i = weeks - 1; i >= 0; i--) {
		const weekStart = addWeeks(currentWeekStart, -i);
		history.push({
			weekStart,
			key: getLocalDateKey(weekStart),
			inProgress: i === 0,
			...getWeekScore(habits, todos, weekStart),
		});
	}

	const previous = history.length > 1 ? history[history.length - 2] : null;
	const thisWeek = history[history.length - 1];

	// Weeks with nothing planned are not achievements; leave them out of the average.
	const scored = history.filter(week => week.planned > 0 && !week.inProgress);
	const average =
		scored.length === 0 ? null : scored.reduce((sum, w) => sum + w.ratio, 0) / scored.length;

	return {
		thisWeek,
		previous,
		history,
		average,
		// Yesterday onwards is settled; today is still open.
		lastFullDay: generateDateOffset(today, -1),
	};
}
