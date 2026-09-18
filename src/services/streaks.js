import { getLocalDateKey, getStartOfWeek } from '../utils/dateHelpers';
import { FREQUENCY, isExpectedOn, weeklyTarget } from './schedule';

// Streaks are derived from the completion history every time they are read,
// never stored. A stored counter drifts the moment a past day is corrected;
// a derived one cannot be wrong.

const EMPTY = { current: 0, best: 0, last: 0, total: 0 };

// results: one boolean per evaluated unit, oldest first, with any still-open
// unit (today, this week) already excluded by the caller.
function summarizeRuns(results) {
	const finishedRuns = [];
	let run = 0;

	for (const hit of results) {
		if (hit) {
			run++;
		} else {
			if (run > 0) finishedRuns.push(run);
			run = 0;
		}
	}

	const current = run;
	const all = current > 0 ? [...finishedRuns, current] : finishedRuns;

	return {
		current,
		best: all.length > 0 ? Math.max(...all) : 0,
		// The run before the current one — still worth seeing after a break.
		last: finishedRuns.length > 0 ? finishedRuns[finishedRuns.length - 1] : 0,
		total: results.filter(Boolean).length,
	};
}

function firstTrackedDate(habit) {
	const completions = habit.completions || [];
	const earliestCompletion = completions.length > 0 ? [...completions].sort()[0] : null;
	const start = habit.startDate ? getLocalDateKey(habit.startDate) : null;

	if (start && earliestCompletion) return start < earliestCompletion ? start : earliestCompletion;
	return start || earliestCompletion;
}

function eachDay(fromKey, through, visit) {
	const cursor = new Date(`${fromKey}T00:00:00`);
	const lastKey = getLocalDateKey(through);

	while (getLocalDateKey(cursor) <= lastKey) {
		visit(new Date(cursor), getLocalDateKey(cursor));
		cursor.setDate(cursor.getDate() + 1);
	}
}

// Consecutive completions that went to plan.
//
// For a daily or fixed-day habit that means consecutive scheduled days. A
// flexible habit has no scheduled days, so it counts completions instead and
// breaks only when a finished week came in under target — ticking one off
// always moves the number either way.
export function calculateDayStreaks(habit, today = new Date()) {
	if (habit.frequency === FREQUENCY.WEEKLY) return flexibleDayStreaks(habit, today);

	const from = firstTrackedDate(habit);
	if (!from) return { ...EMPTY };

	const done = new Set(habit.completions || []);
	const todayKey = getLocalDateKey(today);
	const results = [];

	eachDay(from, today, (date, key) => {
		if (!isExpectedOn(habit, date)) return;
		// Today is not a miss until the day is over.
		if (key === todayKey && !done.has(key)) return;
		results.push(done.has(key));
	});

	return summarizeRuns(results);
}

function flexibleDayStreaks(habit, today) {
	const from = firstTrackedDate(habit);
	if (!from) return { ...EMPTY };

	const done = new Set(habit.completions || []);
	const currentWeekStart = getStartOfWeek(today);
	const cursor = getStartOfWeek(new Date(`${from}T00:00:00`));
	const results = [];

	while (cursor <= currentWeekStart) {
		const target = weeklyTarget(habit, cursor);
		let hits = 0;

		for (let i = 0; i < 7; i++) {
			const day = new Date(cursor);
			day.setDate(cursor.getDate() + i);
			if (done.has(getLocalDateKey(day))) hits++;
		}

		const isCurrentWeek = cursor.getTime() === currentWeekStart.getTime();

		if (target > 0 && !isCurrentWeek && hits < target) {
			// A finished week that fell short ends the run, and its completions
			// do not count toward it.
			results.push(false);
		} else {
			for (let i = 0; i < hits; i++) results.push(true);
		}

		cursor.setDate(cursor.getDate() + 7);
	}

	return summarizeRuns(results);
}

// Consecutive weeks where the habit's weekly target was met.
export function calculateWeekStreaks(habit, today = new Date()) {
	const from = firstTrackedDate(habit);
	if (!from) return { ...EMPTY };

	const done = new Set(habit.completions || []);
	const currentWeekStart = getStartOfWeek(today);
	const cursor = getStartOfWeek(new Date(`${from}T00:00:00`));
	const results = [];

	while (cursor <= currentWeekStart) {
		const target = weeklyTarget(habit, cursor);
		let hits = 0;

		for (let i = 0; i < 7; i++) {
			const day = new Date(cursor);
			day.setDate(cursor.getDate() + i);
			if (done.has(getLocalDateKey(day))) hits++;
		}

		const isCurrentWeek = cursor.getTime() === currentWeekStart.getTime();
		const met = target > 0 && hits >= target;

		// A week with nothing expected (fully paused, or before the habit began)
		// neither breaks the streak nor extends it. The open week only counts
		// once its target is already met.
		if (target > 0 && (!isCurrentWeek || met)) results.push(met);

		cursor.setDate(cursor.getDate() + 7);
	}

	return summarizeRuns(results);
}

// days.total counts completions that went to plan; weeks.total counts weeks
// that hit their target.
export function calculateStreaks(habit, today = new Date()) {
	return {
		days: calculateDayStreaks(habit, today),
		weeks: calculateWeekStreaks(habit, today),
		totalCompletions: (habit.completions || []).length,
	};
}
