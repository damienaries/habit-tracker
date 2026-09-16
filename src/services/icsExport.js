import { buildSchedule, formatTimeOfDay } from './scheduler';
import { getLocalDateKey } from '../utils/dateHelpers';

export const CALENDAR_NAME = 'Habits';
// Apple reads this when subscribing; on a file import it is a hint at best.
export const CALENDAR_COLOR = '#34C759';

const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

// RFC 5545 reserves these characters inside TEXT values.
function escapeText(value) {
	return String(value ?? '')
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r?\n/g, '\\n');
}

// Content lines are limited to 75 octets; continuations begin with a space.
function foldLine(line) {
	if (line.length <= 75) return line;

	const parts = [line.slice(0, 75)];
	let rest = line.slice(75);

	while (rest.length > 74) {
		parts.push(' ' + rest.slice(0, 74));
		rest = rest.slice(74);
	}
	if (rest.length > 0) parts.push(' ' + rest);

	return parts.join('\r\n');
}

function stamp(date) {
	return (
		date.getUTCFullYear() +
		String(date.getUTCMonth() + 1).padStart(2, '0') +
		String(date.getUTCDate()).padStart(2, '0') +
		'T' +
		String(date.getUTCHours()).padStart(2, '0') +
		String(date.getUTCMinutes()).padStart(2, '0') +
		String(date.getUTCSeconds()).padStart(2, '0') +
		'Z'
	);
}

// Floating local time: no TZID and no trailing Z. A 07:00 habit should be 07:00
// wherever you are, which is exactly what floating time means — and it avoids
// shipping a VTIMEZONE block for every zone.
function floating(dateKey, minutes) {
	return `${dateKey.replace(/-/g, '')}T${formatTimeOfDay(minutes).replace(':', '')}00`;
}

// First occurrence on or after `from` that falls on one of the habit's days.
// Recurrence starts from today rather than the habit's start date, so importing
// does not flood the calendar with months of history.
function firstOccurrence(days, from) {
	const cursor = new Date(from);
	cursor.setHours(0, 0, 0, 0);

	for (let i = 0; i < 7; i++) {
		if (days.includes(cursor.getDay())) return cursor;
		cursor.setDate(cursor.getDate() + 1);
	}
	return null;
}

function pausedExclusions(habit, days, from) {
	const dates = [];

	for (const range of habit.pausedRanges || []) {
		if (!range.to) continue;

		const cursor = new Date(`${range.from}T00:00:00`);
		const end = new Date(`${range.to}T00:00:00`);

		while (cursor <= end) {
			if (cursor >= from && days.includes(cursor.getDay())) {
				dates.push(getLocalDateKey(cursor));
			}
			cursor.setDate(cursor.getDate() + 1);
		}
	}

	return dates;
}

function buildEvent(entry, options) {
	const { habit, days, start, duration } = entry;
	const from = options.from;

	const firstDay = firstOccurrence(days, from);
	if (!firstDay) return null;

	const lines = [
		'BEGIN:VEVENT',
		// Stable per habit, so re-importing updates the event instead of
		// creating a second copy of it.
		`UID:habit-${habit.id}@habit-tracker`,
		`DTSTAMP:${stamp(options.now)}`,
		`DTSTART:${floating(getLocalDateKey(firstDay), start)}`,
		`DURATION:PT${duration}M`,
		`SUMMARY:${escapeText(habit.name)}`,
		`CATEGORIES:${escapeText(CALENDAR_NAME)}`,
	];

	const rrule = [`FREQ=WEEKLY`, `BYDAY=${days.map(d => ICS_DAYS[d]).join(',')}`];
	if (habit.endDate) {
		const until = new Date(habit.endDate);
		until.setHours(23, 59, 59, 0);
		lines.push(`RRULE:${rrule.join(';')};UNTIL=${stamp(until)}`);
	} else {
		lines.push(`RRULE:${rrule.join(';')}`);
	}

	if (habit.details) lines.push(`DESCRIPTION:${escapeText(habit.details)}`);

	const exclusions = pausedExclusions(habit, days, from);
	if (exclusions.length > 0) {
		lines.push(`EXDATE:${exclusions.map(key => floating(key, start)).join(',')}`);
	}

	if (options.reminderMinutes !== null) {
		lines.push(
			'BEGIN:VALARM',
			'ACTION:DISPLAY',
			`TRIGGER:-PT${options.reminderMinutes}M`,
			`DESCRIPTION:${escapeText(habit.name)}`,
			'END:VALARM'
		);
	}

	lines.push('END:VEVENT');
	return lines;
}

/**
 * An iCalendar file for every habit the scheduler could place. Habits with no
 * chosen days stay out of it entirely and are reported in `skipped`.
 */
export function buildCalendar(habits, options = {}) {
	const now = options.now || new Date();
	const from = options.from || now;
	const reminderMinutes = options.reminderMinutes === undefined ? 0 : options.reminderMinutes;

	const { scheduled, skipped } = buildSchedule(habits, { ...options, today: now });

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Habit Tracker//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(CALENDAR_NAME)}`,
		`X-APPLE-CALENDAR-COLOR:${CALENDAR_COLOR}`,
	];

	for (const entry of scheduled) {
		const event = buildEvent(entry, { now, from, reminderMinutes });
		if (event) lines.push(...event);
	}

	lines.push('END:VCALENDAR');

	return {
		ics: lines.map(foldLine).join('\r\n') + '\r\n',
		scheduled,
		skipped,
	};
}
