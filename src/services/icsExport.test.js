import { describe, it, expect } from 'vitest';
import { buildCalendar } from './icsExport';
import { FREQUENCY } from './schedule';

const NOW = new Date(2024, 5, 3, 9, 0, 0); // Monday 3 June 2024

const habit = (id, overrides = {}) => ({
	id,
	name: id,
	frequency: FREQUENCY.DAILY,
	startDate: new Date(2024, 0, 1),
	completions: [],
	durationMinutes: 30,
	timeOfDay: null,
	...overrides,
});

const build = (habits, options = {}) =>
	buildCalendar(habits, { now: NOW, from: NOW, ...options });

const eventFor = (ics, name) => {
	const events = ics.split('BEGIN:VEVENT').slice(1);
	return events.find(e => e.includes(`SUMMARY:${name}`));
};

describe('calendar envelope', () => {
	it('wraps the events and names the calendar', () => {
		const { ics } = build([habit('read')]);

		expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
		expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
		expect(ics).toContain('X-WR-CALNAME:Habits');
		expect(ics).toContain('X-APPLE-CALENDAR-COLOR:#34C759');
	});

	it('uses CRLF line endings as the spec requires', () => {
		const { ics } = build([habit('read')]);
		expect(ics).toContain('\r\n');
		expect(/[^\r]\n/.test(ics)).toBe(false);
	});
});

describe('events', () => {
	it('gives each habit a stable id so re-import updates rather than duplicates', () => {
		const first = build([habit('read')]).ics;
		const second = build([habit('read')]).ics;

		expect(first).toContain('UID:habit-read@habit-tracker');
		expect(first).toBe(second);
	});

	it('repeats weekly on the habit days', () => {
		const { ics } = build([
			habit('write', {
				frequency: FREQUENCY.SPECIFIC_DAYS,
				daysOfWeek: [6, 0],
				timeOfDay: '10:00',
			}),
		]);

		expect(eventFor(ics, 'write')).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU,SA');
	});

	it('uses floating local time so a 07:00 habit stays 07:00 anywhere', () => {
		const { ics } = build([habit('meditate', { timeOfDay: '07:00' })]);
		const event = eventFor(ics, 'meditate');

		expect(event).toMatch(/DTSTART:\d{8}T070000\r\n/);
		expect(event).not.toContain('TZID');
		expect(event).not.toMatch(/DTSTART:\d{8}T\d{6}Z/);
	});

	it('starts the series today, not at the habit start date', () => {
		const { ics } = build([habit('read', { startDate: new Date(2023, 0, 1) })]);
		expect(eventFor(ics, 'read')).toContain('DTSTART:20240603T');
	});

	it('begins on the first matching day for a fixed-day habit', () => {
		// Monday 3 June; a Saturday habit should start on the 8th.
		const { ics } = build([
			habit('write', { frequency: FREQUENCY.SPECIFIC_DAYS, daysOfWeek: [6] }),
		]);
		expect(eventFor(ics, 'write')).toContain('DTSTART:20240608T');
	});

	it('stops a finished habit with UNTIL', () => {
		const { ics } = build([habit('done', { endDate: new Date(2024, 5, 20) })]);
		expect(ics).not.toContain('SUMMARY:done');
	});

	it('carries the duration the scheduler assigned', () => {
		const { ics } = build([habit('meditate', { timeOfDay: '07:00', durationMinutes: 10 })]);
		expect(eventFor(ics, 'meditate')).toContain('DURATION:PT10M');
	});

	it('excludes days inside a closed pause range', () => {
		const { ics } = build([
			habit('read', { pausedRanges: [{ from: '2024-06-05', to: '2024-06-06' }] }),
		]);

		const event = eventFor(ics, 'read');
		expect(event).toContain('EXDATE:20240605T');
		expect(event).toContain('20240606T');
	});

	it('adds a reminder at the start of the block', () => {
		const { ics } = build([habit('read')]);
		expect(eventFor(ics, 'read')).toContain('TRIGGER:-PT0M');
	});

	it('can leave reminders out', () => {
		const { ics } = build([habit('read')], { reminderMinutes: null });
		expect(ics).not.toContain('BEGIN:VALARM');
	});
});

describe('text safety', () => {
	it('escapes the characters the format reserves', () => {
		const { ics } = build([
			habit('x', { name: 'Gym; lift, then run\\stretch', details: 'line one\nline two' }),
		]);

		expect(ics).toContain('Gym\\; lift\\, then run\\\\stretch');
		expect(ics).toContain('line one\\nline two');
	});

	it('folds long lines at the 75 octet limit', () => {
		const { ics } = build([habit('x', { name: 'A'.repeat(200) })]);

		for (const line of ics.split('\r\n')) {
			expect(line.length).toBeLessThanOrEqual(75);
		}
	});
});

describe('what stays out', () => {
	it('omits habits with no chosen days and says why', () => {
		const { ics, skipped } = build([
			habit('gym', { frequency: FREQUENCY.WEEKLY, timesPerPeriod: 3 }),
		]);

		expect(ics).not.toContain('SUMMARY:gym');
		expect(skipped.find(s => s.habit.id === 'gym').reason).toBe('no-days');
	});

	it('omits paused habits', () => {
		const { ics } = build([
			habit('resting', { pausedRanges: [{ from: '2020-01-01', to: null }] }),
		]);
		expect(ics).not.toContain('SUMMARY:resting');
	});
});
