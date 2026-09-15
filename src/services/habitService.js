import { db } from '../db/habitDb';
import { getLocalDateKey } from '../utils/dateHelpers';
import { FREQUENCY, END_REASON } from './schedule';

// Create a new habit
export async function createHabit({
	userId,
	name,
	frequency,
	startDate,
	endDate = null,
	daysOfWeek = null,
	timesPerPeriod = null,
	durationMinutes = null,
	timeOfDay = null,
	details = '',
}) {
	if (!userId || !name || !frequency || !startDate) {
		throw new Error('User ID, name, frequency, and start date are required');
	}

	if (frequency === FREQUENCY.SPECIFIC_DAYS && !(daysOfWeek || []).length) {
		throw new Error('Pick at least one day of the week');
	}

	return await db.habits.add({
		userId,
		name,
		frequency,
		startDate,
		endDate,
		daysOfWeek,
		timesPerPeriod,
		durationMinutes,
		timeOfDay,
		details,
		completions: [],
		pausedRanges: [],
		endReason: null,
	});
}

// Pause and resume are recorded as ranges so that, later, a gap in the history
// can be told apart from a missed day when streaks are recalculated.
export async function pauseHabit(id, on = new Date()) {
	const habit = await getHabit(id);
	const ranges = habit.pausedRanges || [];
	if (ranges.some(r => !r.to)) return;

	return await db.habits.update(id, {
		pausedRanges: [...ranges, { from: getLocalDateKey(on), to: null }],
	});
}

export async function resumeHabit(id, on = new Date()) {
	const habit = await getHabit(id);
	const ranges = habit.pausedRanges || [];

	// The range end is inclusive, so resuming today means the last paused day
	// was yesterday. Pausing and resuming on the same day leaves from > to,
	// which isPausedOn reads as an empty range.
	const lastPausedDay = new Date(on);
	lastPausedDay.setDate(lastPausedDay.getDate() - 1);

	return await db.habits.update(id, {
		pausedRanges: ranges.map(r => (r.to ? r : { ...r, to: getLocalDateKey(lastPausedDay) })),
	});
}

// Get all habits for a user
export async function getAllHabits(userId) {
	if (!userId) {
		throw new Error('User ID is required');
	}
	return await db.habits.where('userId').equals(userId).toArray();
}

// Get a habit by ID
export async function getHabit(id) {
	if (!id) {
		throw new Error('Habit ID is required');
	}

	const habit = await db.habits.get(id);
	if (!habit) {
		throw new Error(`Habit with ID ${id} not found`);
	}

	return habit;
}

// update a habit
export async function updateHabit(id, updates) {
	if (!id) {
		throw new Error('Habit ID is required');
	}

	const habit = await db.habits.get(id);
	if (!habit) {
		throw new Error(`Habit with ID ${id} not found`);
	}

	return await db.habits.update(id, updates);
}

// Mark a habit finished. The record stays: its completions, streaks and best
// runs are all preserved and simply stop advancing from this date. This is the
// path for a habit that served its purpose — use deleteHabit only to erase one
// that should never have existed.
export async function endHabit(id, reason, on = new Date()) {
	if (!Object.values(END_REASON).includes(reason)) {
		throw new Error(`Unknown end reason: ${reason}`);
	}
	await getHabit(id);
	return await db.habits.update(id, { endDate: on, endReason: reason });
}

export async function reopenHabit(id) {
	await getHabit(id);
	return await db.habits.update(id, { endDate: null, endReason: null });
}

// Permanently erase a habit and everything recorded against it.
export async function deleteHabit(id) {
	if (!id) {
		throw new Error('Habit ID is required');
	}

	const habit = await db.habits.get(id);
	if (!habit) {
		throw new Error(`Habit with ID ${id} not found`);
	}

	await db.habits.delete(id);
}
