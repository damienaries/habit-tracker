import { getLocalDateKey } from '../utils/dateHelpers';

export const FREQUENCY = {
	// Every day.
	DAILY: 'daily',
	// Fixed weekdays, e.g. every Tuesday and Thursday.
	SPECIFIC_DAYS: 'specificDays',
	// N times a week, any days.
	WEEKLY: 'weekly',
};

// Every habit gets a real block by default rather than a null placeholder.
export const DEFAULT_DURATION_MINUTES = 30;

export const END_REASON = {
	COMPLETED: 'completed',
	QUIT: 'quit',
};

export function isPausedOn(habit, dateKey) {
	return (habit.pausedRanges || []).some(
		({ from, to }) => dateKey >= from && (!to || dateKey <= to)
	);
}

export function isPausedNow(habit) {
	return isPausedOn(habit, getLocalDateKey(new Date()));
}

// Did the habit exist on this date — started and not yet ended? Pause is
// deliberately not considered here: a paused habit still belongs on the day
// card, greyed out, so it can be seen and resumed.
export function isActiveOn(habit, date) {
	const key = getLocalDateKey(date);
	if (habit.startDate && key < getLocalDateKey(habit.startDate)) return false;
	if (habit.endDate && key > getLocalDateKey(habit.endDate)) return false;
	return true;
}

// Was the habit meant to be done on this specific date? This is what makes a
// gap a miss, so a Tuesday/Thursday habit is not broken by a Wednesday.
// Flexible weekly habits have no fixed day, so they are never "missed" on a
// given date — their target is scored per week instead.
export function isExpectedOn(habit, date) {
	if (!isActiveOn(habit, date)) return false;
	if (isPausedOn(habit, getLocalDateKey(date))) return false;

	switch (habit.frequency) {
		case FREQUENCY.DAILY:
			return true;
		case FREQUENCY.SPECIFIC_DAYS:
			return (habit.daysOfWeek || []).includes(new Date(date).getDay());
		default:
			return false;
	}
}

// Should the habit show on this day's card? Separate question from
// isExpectedOn: a flexible weekly habit has no single required day, but it is
// still offered every day — including after its target is met, so an extra
// session can be logged rather than the card vanishing.
export function shouldAppearOn(habit, date) {
	if (!isActiveOn(habit, date)) return false;

	if (habit.frequency === FREQUENCY.SPECIFIC_DAYS) {
		return (habit.daysOfWeek || []).includes(new Date(date).getDay());
	}

	return true;
}

/**
 * Is this offered as extra credit rather than owed?
 *
 * A flexible habit that has already hit its weekly target still shows, but it
 * must not count against the day — you finished what you set out to do, and
 * leaving it in the denominator would make Friday look like a failure for not
 * doing a fifth workout you never promised.
 */
export function isBonusOn(habit, date, completionsThisWeek = 0) {
	if (habit.frequency !== FREQUENCY.WEEKLY) return false;
	if ((habit.completions || []).includes(getLocalDateKey(date))) return false;

	return completionsThisWeek >= (habit.timesPerPeriod || 1);
}

// How many completions count as a full week for this habit. A week the habit
// was not live for — before it started, after it was completed, or while it was
// paused — has no target, so it neither breaks nor extends a streak.
export function weeklyTarget(habit, weekStart) {
	if (habit.frequency === FREQUENCY.WEEKLY) {
		// A target of "3 times a week" only makes sense over a whole week. If
		// the habit started, ended or was paused partway through, the week is
		// skipped rather than judged against a target it never had a chance to
		// meet — the same reasoning the day-count branch below applies.
		for (let i = 0; i < 7; i++) {
			const day = new Date(weekStart);
			day.setDate(weekStart.getDate() + i);
			if (!isActiveOn(habit, day) || isPausedOn(habit, getLocalDateKey(day))) return 0;
		}
		return habit.timesPerPeriod || 1;
	}

	// Daily and fixed-day habits: count the days actually expected that week, so
	// a habit that started on Thursday is not judged against a full seven days.
	let target = 0;
	for (let i = 0; i < 7; i++) {
		const day = new Date(weekStart);
		day.setDate(weekStart.getDate() + i);
		if (isExpectedOn(habit, day)) target++;
	}
	return target;
}
