import { describe, it, expect } from 'vitest';
import { getWeekScore, getStats } from './stats';
import { FREQUENCY } from './schedule';

const MON_JUN_3 = new Date(2024, 5, 3);
const START = new Date(2024, 0, 1);

const flexible = (times, completions) => ({
	id: 'gym',
	frequency: FREQUENCY.WEEKLY,
	timesPerPeriod: times,
	startDate: START,
	completions,
});

const daily = completions => ({
	id: 'read',
	frequency: FREQUENCY.DAILY,
	startDate: START,
	completions,
});

const onDays = (days, completions) => ({
	id: 'write',
	frequency: FREQUENCY.SPECIFIC_DAYS,
	daysOfWeek: days,
	startDate: START,
	completions,
});

const todo = (id, dueDate, completedOn = null) => ({ id, title: id, dueDate, completedOn });

describe('getWeekScore', () => {
	it('scores a flexible habit once per week, not once per day it appears', () => {
		// The trap: this habit shows on the card every day until its target lands.
		const score = getWeekScore([flexible(3, ['2024-06-03', '2024-06-05'])], [], MON_JUN_3);

		expect(score.planned).toBe(3);
		expect(score.done).toBe(2);
	});

	it('caps completions at the target so extra credit cannot exceed 100%', () => {
		const score = getWeekScore(
			[flexible(2, ['2024-06-03', '2024-06-04', '2024-06-05', '2024-06-06'])],
			[],
			MON_JUN_3
		);

		expect(score.done).toBe(2);
		expect(score.ratio).toBe(1);
	});

	it('counts a daily habit as seven', () => {
		const score = getWeekScore([daily(['2024-06-03', '2024-06-04'])], [], MON_JUN_3);
		expect(score).toMatchObject({ planned: 7, done: 2 });
	});

	it('counts a fixed-day habit as its days', () => {
		const score = getWeekScore([onDays([2, 4], ['2024-06-04'])], [], MON_JUN_3);
		expect(score).toMatchObject({ planned: 2, done: 1 });
	});

	it('folds todos in', () => {
		const score = getWeekScore(
			[],
			[todo('a', '2024-06-04', '2024-06-04'), todo('b', '2024-06-06')],
			MON_JUN_3
		);
		expect(score).toMatchObject({ planned: 2, done: 1, ratio: 0.5 });
	});

	it('ignores a week the habit was not live for', () => {
		const later = { ...daily([]), startDate: new Date(2024, 6, 1) };
		expect(getWeekScore([later], [], MON_JUN_3)).toMatchObject({ planned: 0, ratio: 0 });
	});
});

describe('getStats', () => {
	it('returns the requested window, oldest first, ending this week', () => {
		const stats = getStats([daily([])], [], new Date(2024, 5, 5), 12);

		expect(stats.history).toHaveLength(12);
		expect(stats.history[11].inProgress).toBe(true);
		expect(stats.thisWeek).toBe(stats.history[11]);
	});

	it('leaves the week in progress out of the average', () => {
		// Nothing done at all, but this week is only part-way through.
		const stats = getStats([daily([])], [], new Date(2024, 5, 5), 3);
		expect(stats.history.filter(w => w.inProgress)).toHaveLength(1);
		expect(stats.average).toBe(0);
	});

	it('has no average when nothing was ever planned', () => {
		const stats = getStats([], [], new Date(2024, 5, 5), 4);
		expect(stats.average).toBeNull();
	});
});

describe('getHabitScore', () => {
	it('scores a habit the same way a week is scored, target by target', async () => {
		const { getHabitScore } = await import('./stats');
		// Two full weeks: 2 of 3 in the first, 3 of 3 in the second.
		const habit = {
			...flexible(3, [
				'2024-06-03', '2024-06-05',
				'2024-06-10', '2024-06-12', '2024-06-14',
			]),
			startDate: MON_JUN_3,
		};

		const score = getHabitScore(habit, new Date(2024, 5, 18));
		expect(score).toMatchObject({ planned: 6, done: 5, weeks: 2 });
		expect(score.ratio).toBeCloseTo(5 / 6);
	});

	it('caps extra sessions so a habit cannot exceed 100%', async () => {
		const { getHabitScore } = await import('./stats');
		const habit = {
			...flexible(2, ['2024-06-03', '2024-06-04', '2024-06-05', '2024-06-06']),
			startDate: MON_JUN_3,
		};

		expect(getHabitScore(habit, new Date(2024, 5, 11)).ratio).toBe(1);
	});

	it('counts days since the habit was created', async () => {
		const { getHabitScore } = await import('./stats');
		const habit = { ...daily([]), startDate: MON_JUN_3 };

		expect(getHabitScore(habit, MON_JUN_3).daysTracked).toBe(1);
		expect(getHabitScore(habit, new Date(2024, 5, 12)).daysTracked).toBe(10);
	});

	it('has no rate for a habit created this week', async () => {
		const { getHabitScore } = await import('./stats');
		const habit = { ...daily([]), startDate: new Date(2024, 5, 4) };

		// Tuesday start, read on Wednesday — no completed week to score.
		expect(getHabitScore(habit, new Date(2024, 5, 5)).ratio).toBeNull();
	});

	it('skips weeks the habit was paused or not yet live', async () => {
		const { getHabitScore } = await import('./stats');
		const habit = {
			...daily(['2024-06-10']),
			startDate: MON_JUN_3,
			pausedRanges: [{ from: '2024-06-03', to: '2024-06-09' }],
		};

		// The paused week contributes nothing at all.
		expect(getHabitScore(habit, new Date(2024, 5, 18)).weeks).toBe(1);
	});
})
