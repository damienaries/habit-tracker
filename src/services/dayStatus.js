import { getLocalDateKey, getStartOfWeek, isSameDay } from '../utils/dateHelpers';
import { shouldAppearOn, isExpectedOn } from './schedule';

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
	return habits.filter(habit =>
		shouldAppearOn(habit, date, completionsInWeekOf(habit, date))
	);
}

// One word for how a day went, shared by the month grid and the day views so
// the calendar and the day itself can never disagree. Paused habits are shown
// but not judged.
export function getDayStatus(habits, date, today = new Date()) {
	if (!isSameDay(date, today) && date > today) return 'future';

	const onThisDay = habitsForDay(habits, date);
	if (onThisDay.length === 0) return 'no-habits';

	const dateKey = getLocalDateKey(date);
	const isDone = habit => (habit.completions || []).includes(dateKey);

	// Only habits actually due on this date are judged. A paused habit, or one
	// whose target is weekly rather than daily, is shown but never counted as a
	// miss against a particular day.
	const judged = onThisDay.filter(habit => isExpectedOn(habit, date));

	if (judged.length === 0) {
		return onThisDay.some(isDone) ? 'completed' : 'no-habits';
	}

	const doneCount = judged.filter(isDone).length;

	if (doneCount === judged.length) return 'completed';
	// Anything done counts as partial, including a weekly habit that was not
	// owed today — a day with real effort in it should not read as a blank miss.
	if (onThisDay.some(isDone)) return 'partial';
	return isSameDay(date, today) ? 'today-pending' : 'incomplete';
}
