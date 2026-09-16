import { FREQUENCY, isPausedOn } from './schedule';
import { getLocalDateKey } from '../utils/dateHelpers';

export const DEFAULT_DURATION_MINUTES = 30;
export const MIN_BLOCK_MINUTES = 30;
export const DEFAULT_DAY_START = '09:00';
export const DEFAULT_DAY_END = '22:00';

export function parseTimeOfDay(value) {
	if (typeof value !== 'string') return null;
	const match = /^(\d{1,2}):(\d{2})$/.exec(value);
	if (!match) return null;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours > 23 || minutes > 59) return null;

	return hours * 60 + minutes;
}

export function formatTimeOfDay(minutes) {
	const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
	return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
}

// Which weekdays a habit lands on. A habit with no days — "three times a week,
// whenever" — returns null: it keeps its flexibility and stays off the calendar
// until actual days are chosen for it.
export function scheduledDaysFor(habit) {
	if (habit.frequency === FREQUENCY.DAILY) return [0, 1, 2, 3, 4, 5, 6];
	if (habit.frequency === FREQUENCY.SPECIFIC_DAYS) {
		const days = habit.daysOfWeek || [];
		return days.length > 0 ? [...days].sort() : null;
	}
	return null;
}

function overlaps(startA, endA, startB, endB) {
	return startA < endB && startB < endA;
}

// Earliest start from `from` where the block is free on every one of its days.
// One recurring event carries a single start time, so a slot taken on any of a
// habit's days rules it out for all of them.
function findSlot(days, duration, occupancy, from, until) {
	let candidate = from;

	while (candidate + duration <= until) {
		let blockedUntil = null;

		for (const day of days) {
			for (const block of occupancy.get(day) || []) {
				if (overlaps(candidate, candidate + duration, block.start, block.end)) {
					blockedUntil = Math.max(blockedUntil ?? 0, block.end);
				}
			}
		}

		if (blockedUntil === null) return candidate;
		candidate = blockedUntil;
	}

	return null;
}

function claim(occupancy, days, start, duration) {
	for (const day of days) {
		const blocks = occupancy.get(day) || [];
		blocks.push({ start, end: start + duration });
		occupancy.set(day, blocks);
	}
}

/**
 * Lay habits out into non-overlapping weekly blocks.
 *
 * Habits with an explicit time are anchors and are placed first — they are
 * stated commitments. Everything else is packed into the gaps in stable id
 * order, so re-running this produces an identical schedule.
 *
 * Conflicts are resolved only between these blocks. Nothing here can see the
 * user's real calendar, so a block may still land on an actual meeting.
 */
export function buildSchedule(habits, options = {}) {
	const dayStart = parseTimeOfDay(options.dayStart || DEFAULT_DAY_START);
	const dayEnd = parseTimeOfDay(options.dayEnd || DEFAULT_DAY_END);
	const today = options.today || new Date();

	const occupancy = new Map();
	const scheduled = [];
	const skipped = [];

	const candidates = [];
	for (const habit of habits) {
		if (habit.endDate) {
			skipped.push({ habit, reason: 'finished' });
			continue;
		}
		if (isPausedOn(habit, getLocalDateKey(today))) {
			skipped.push({ habit, reason: 'paused' });
			continue;
		}

		const days = scheduledDaysFor(habit);
		if (!days) {
			skipped.push({ habit, reason: 'no-days' });
			continue;
		}

		candidates.push({ habit, days, fixedStart: parseTimeOfDay(habit.timeOfDay) });
	}

	const byId = (a, b) => String(a.habit.id).localeCompare(String(b.habit.id));
	const anchored = candidates.filter(c => c.fixedStart !== null).sort(byId);
	const floating = candidates.filter(c => c.fixedStart === null).sort(byId);

	for (const { habit, days, fixedStart } of anchored) {
		// A stated duration is respected as given — the minimum only applies to
		// blocks this scheduler places itself.
		const duration = habit.durationMinutes || DEFAULT_DURATION_MINUTES;
		claim(occupancy, days, fixedStart, duration);
		scheduled.push({ habit, days, start: fixedStart, duration, anchored: true });
	}

	for (const { habit, days } of floating) {
		const duration = Math.max(habit.durationMinutes || DEFAULT_DURATION_MINUTES, MIN_BLOCK_MINUTES);
		const start = findSlot(days, duration, occupancy, dayStart, dayEnd);

		if (start === null) {
			skipped.push({ habit, reason: 'day-full' });
			continue;
		}

		claim(occupancy, days, start, duration);
		scheduled.push({ habit, days, start, duration, anchored: false });
	}

	scheduled.sort((a, b) => a.start - b.start || byId({ habit: a.habit }, { habit: b.habit }));

	return { scheduled, skipped };
}
