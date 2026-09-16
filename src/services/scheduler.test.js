import { describe, it, expect } from 'vitest';
import { buildSchedule, formatTimeOfDay, scheduledDaysFor, parseTimeOfDay } from './scheduler';
import { FREQUENCY } from './schedule';

const habit = (id, overrides = {}) => ({
	id,
	name: id,
	frequency: FREQUENCY.DAILY,
	startDate: new Date(2024, 5, 3),
	completions: [],
	durationMinutes: null,
	timeOfDay: null,
	...overrides,
});

const at = (result, id) => result.scheduled.find(s => s.habit.id === id);
const timeOf = (result, id) => formatTimeOfDay(at(result, id).start);
const reasonFor = (result, id) => result.skipped.find(s => s.habit.id === id)?.reason;

describe('scheduledDaysFor', () => {
	it('spreads a daily habit across the week', () => {
		expect(scheduledDaysFor(habit('a'))).toEqual([0, 1, 2, 3, 4, 5, 6]);
	});

	it('uses the chosen days, sorted', () => {
		const h = habit('a', { frequency: FREQUENCY.SPECIFIC_DAYS, daysOfWeek: [4, 2] });
		expect(scheduledDaysFor(h)).toEqual([2, 4]);
	});

	it('gives no days to a flexible weekly habit', () => {
		const h = habit('a', { frequency: FREQUENCY.WEEKLY, timesPerPeriod: 3 });
		expect(scheduledDaysFor(h)).toBeNull();
	});
});

describe('parseTimeOfDay', () => {
	it('reads HH:MM', () => {
		expect(parseTimeOfDay('09:00')).toBe(540);
		expect(parseTimeOfDay('00:00')).toBe(0);
		expect(parseTimeOfDay('23:59')).toBe(1439);
	});

	it('rejects nonsense', () => {
		expect(parseTimeOfDay('25:00')).toBeNull();
		expect(parseTimeOfDay('9am')).toBeNull();
		expect(parseTimeOfDay(null)).toBeNull();
	});
});

describe('buildSchedule', () => {
	it('packs unscheduled habits from 09:00 in 30 minute blocks', () => {
		const result = buildSchedule([habit('read'), habit('stretch')]);

		expect(timeOf(result, 'read')).toBe('09:00');
		expect(timeOf(result, 'stretch')).toBe('09:30');
	});

	it('leaves habits with a stated time exactly where they are', () => {
		const result = buildSchedule([
			habit('meditate', { timeOfDay: '07:00', durationMinutes: 10 }),
			habit('read'),
		]);

		expect(timeOf(result, 'meditate')).toBe('07:00');
		expect(at(result, 'meditate').duration).toBe(10);
		expect(timeOf(result, 'read')).toBe('09:00');
	});

	it('applies the 30 minute floor only to blocks it places itself', () => {
		const result = buildSchedule([
			habit('vitamins', { durationMinutes: 5 }),
			habit('quickfix', { durationMinutes: 5, timeOfDay: '08:00' }),
		]);

		expect(at(result, 'vitamins').duration).toBe(30);
		expect(at(result, 'quickfix').duration).toBe(5);
	});

	it('packs around an anchored block rather than over it', () => {
		const result = buildSchedule([
			habit('standup', { timeOfDay: '09:00', durationMinutes: 30 }),
			habit('read'),
		]);

		expect(timeOf(result, 'read')).toBe('09:30');
	});

	it('avoids a slot taken on any one of the days a habit runs', () => {
		// The writing block only occupies Saturday, but a daily habit carries a
		// single start time, so it has to clear 10:00 on every day.
		const result = buildSchedule([
			habit('write', {
				frequency: FREQUENCY.SPECIFIC_DAYS,
				daysOfWeek: [6],
				timeOfDay: '09:00',
				durationMinutes: 30,
			}),
			habit('read'),
		]);

		expect(timeOf(result, 'read')).toBe('09:30');
	});

	it('does not make habits on different days avoid each other', () => {
		const result = buildSchedule([
			habit('sat', { frequency: FREQUENCY.SPECIFIC_DAYS, daysOfWeek: [6] }),
			habit('sun', { frequency: FREQUENCY.SPECIFIC_DAYS, daysOfWeek: [0] }),
		]);

		expect(timeOf(result, 'sat')).toBe('09:00');
		expect(timeOf(result, 'sun')).toBe('09:00');
	});

	it('produces the same schedule every run', () => {
		const habits = [habit('c'), habit('a'), habit('b')];
		const first = buildSchedule(habits);
		const second = buildSchedule([...habits].reverse());

		expect(first.scheduled.map(s => [s.habit.id, s.start])).toEqual(
			second.scheduled.map(s => [s.habit.id, s.start])
		);
	});

	it('leaves flexible weekly habits off the calendar', () => {
		const result = buildSchedule([
			habit('gym', { frequency: FREQUENCY.WEEKLY, timesPerPeriod: 3 }),
		]);

		expect(result.scheduled).toHaveLength(0);
		expect(reasonFor(result, 'gym')).toBe('no-days');
	});

	it('leaves out a fixed-day habit with no days chosen', () => {
		const result = buildSchedule([
			habit('ghost', { frequency: FREQUENCY.SPECIFIC_DAYS, daysOfWeek: [] }),
		]);

		expect(reasonFor(result, 'ghost')).toBe('no-days');
	});

	it('leaves out finished and paused habits', () => {
		const result = buildSchedule([
			habit('done', { endDate: new Date(2024, 5, 10) }),
			habit('resting', { pausedRanges: [{ from: '2020-01-01', to: null }] }),
		]);

		expect(result.scheduled).toHaveLength(0);
		expect(reasonFor(result, 'done')).toBe('finished');
		expect(reasonFor(result, 'resting')).toBe('paused');
	});

	it('reports habits it cannot fit rather than stacking them', () => {
		// Twenty-six 30-minute blocks cannot fit between 09:00 and 22:00.
		const many = Array.from({ length: 30 }, (_, i) =>
			habit(`h${String(i).padStart(2, '0')}`)
		);
		const result = buildSchedule(many);

		expect(result.scheduled).toHaveLength(26);
		expect(result.skipped.every(s => s.reason === 'day-full')).toBe(true);

		const starts = result.scheduled.map(s => s.start);
		expect(new Set(starts).size).toBe(starts.length);
	});

	it('honours a custom day window', () => {
		const result = buildSchedule([habit('read')], { dayStart: '18:00', dayEnd: '21:00' });
		expect(timeOf(result, 'read')).toBe('18:00');
	});

	it('never overlaps two blocks that share a day', () => {
		const result = buildSchedule([
			habit('a', { timeOfDay: '09:15', durationMinutes: 45 }),
			habit('b'),
			habit('c'),
			habit('d', { frequency: FREQUENCY.SPECIFIC_DAYS, daysOfWeek: [1, 3] }),
		]);

		for (let day = 0; day < 7; day++) {
			const blocks = result.scheduled
				.filter(s => s.days.includes(day))
				.map(s => [s.start, s.start + s.duration])
				.sort((x, y) => x[0] - y[0]);

			for (let i = 1; i < blocks.length; i++) {
				expect(blocks[i][0]).toBeGreaterThanOrEqual(blocks[i - 1][1]);
			}
		}
	});
});
