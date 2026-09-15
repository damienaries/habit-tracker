import { describe, it, expect } from 'vitest';
import { calculateDayStreaks, calculateWeekStreaks } from './streaks';
import { FREQUENCY } from './schedule';

// June 2024: 3rd is a Monday, so weeks run 3-9, 10-16, 17-23.
const MON_JUN_3 = new Date(2024, 5, 3);

const daily = (completions, overrides = {}) => ({
	frequency: FREQUENCY.DAILY,
	startDate: MON_JUN_3,
	completions,
	...overrides,
});

const tueThu = (completions, overrides = {}) => ({
	frequency: FREQUENCY.SPECIFIC_DAYS,
	daysOfWeek: [2, 4],
	startDate: MON_JUN_3,
	completions,
	...overrides,
});

describe('day streaks', () => {
	it('counts consecutive completed days', () => {
		const habit = daily(['2024-06-03', '2024-06-04', '2024-06-05']);
		expect(calculateDayStreaks(habit, new Date(2024, 5, 5))).toMatchObject({
			current: 3,
			best: 3,
			last: 0,
		});
	});

	it('does not break the streak for a today that is not done yet', () => {
		const habit = daily(['2024-06-03', '2024-06-04']);
		// Wednesday the 5th is still open — the streak stands at 2, not 0.
		expect(calculateDayStreaks(habit, new Date(2024, 5, 5)).current).toBe(2);
	});

	it('keeps best and last after a streak breaks', () => {
		// 3 days, miss the 6th, then 2 days.
		const habit = daily(['2024-06-03', '2024-06-04', '2024-06-05', '2024-06-07', '2024-06-08']);
		expect(calculateDayStreaks(habit, new Date(2024, 5, 8))).toMatchObject({
			current: 2,
			best: 3,
			last: 3,
			total: 5,
		});
	});

	it('reports last when the current streak is zero', () => {
		const habit = daily(['2024-06-03', '2024-06-04', '2024-06-05']);
		// Missed the 6th and the 7th; the 7th is today and still open, so the
		// 6th is the only recorded miss.
		expect(calculateDayStreaks(habit, new Date(2024, 5, 7))).toMatchObject({
			current: 0,
			best: 3,
			last: 3,
		});
	});

	it('skips unscheduled weekdays rather than counting them as misses', () => {
		// Tue 4th, Thu 6th, Tue 11th — Wednesday must not break it.
		const habit = tueThu(['2024-06-04', '2024-06-06', '2024-06-11']);
		expect(calculateDayStreaks(habit, new Date(2024, 5, 11))).toMatchObject({
			current: 3,
			best: 3,
		});
	});

	it('breaks when a scheduled day is actually missed', () => {
		// Tue 4th done, Thu 6th missed, Tue 11th done.
		const habit = tueThu(['2024-06-04', '2024-06-11']);
		expect(calculateDayStreaks(habit, new Date(2024, 5, 11))).toMatchObject({
			current: 1,
			best: 1,
			last: 1,
		});
	});

	it('is null for flexible weekly habits', () => {
		const habit = {
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 3,
			startDate: MON_JUN_3,
			completions: ['2024-06-03'],
		};
		expect(calculateDayStreaks(habit, new Date(2024, 5, 5))).toBeNull();
	});

	it('does not count paused days as misses', () => {
		const habit = daily(['2024-06-03', '2024-06-07'], {
			pausedRanges: [{ from: '2024-06-04', to: '2024-06-06' }],
		});
		expect(calculateDayStreaks(habit, new Date(2024, 5, 7)).current).toBe(2);
	});

	it('ignores completions before the habit started', () => {
		const habit = daily(['2024-06-03', '2024-06-04'], { startDate: new Date(2024, 5, 4) });
		expect(calculateDayStreaks(habit, new Date(2024, 5, 4)).current).toBe(1);
	});
});

describe('week streaks', () => {
	it('counts consecutive weeks that hit a 3x target', () => {
		const habit = {
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 3,
			startDate: MON_JUN_3,
			completions: [
				'2024-06-03', '2024-06-05', '2024-06-07', // week 1
				'2024-06-10', '2024-06-12', '2024-06-14', // week 2
			],
		};
		expect(calculateWeekStreaks(habit, new Date(2024, 5, 16))).toMatchObject({
			current: 2,
			best: 2,
			total: 2,
		});
	});

	it('breaks the week streak when a target is missed', () => {
		const habit = {
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 3,
			startDate: MON_JUN_3,
			completions: [
				'2024-06-03', '2024-06-05', '2024-06-07', // week 1: hit
				'2024-06-10', // week 2: only 1 of 3
				'2024-06-17', '2024-06-19', '2024-06-21', // week 3: hit
			],
		};
		expect(calculateWeekStreaks(habit, new Date(2024, 5, 23))).toMatchObject({
			current: 1,
			best: 1,
			last: 1,
			total: 2,
		});
	});

	it('does not count the open week as a miss before it is over', () => {
		const habit = {
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 3,
			startDate: MON_JUN_3,
			completions: ['2024-06-03', '2024-06-05', '2024-06-07', '2024-06-10'],
		};
		// Week 2 has 1 of 3 so far, mid-week. Week 1's streak must survive.
		expect(calculateWeekStreaks(habit, new Date(2024, 5, 11)).current).toBe(1);
	});

	it('judges a daily habit against the days it was actually expected', () => {
		// Starts Thursday: only Thu/Fri/Sat/Sun are expected in week 1.
		const habit = daily(['2024-06-06', '2024-06-07', '2024-06-08', '2024-06-09'], {
			startDate: new Date(2024, 5, 6),
		});
		expect(calculateWeekStreaks(habit, new Date(2024, 5, 9)).current).toBe(1);
	});

	it('counts a Tuesday/Thursday week as complete with both days done', () => {
		const habit = tueThu(['2024-06-04', '2024-06-06', '2024-06-11', '2024-06-13']);
		expect(calculateWeekStreaks(habit, new Date(2024, 5, 16))).toMatchObject({
			current: 2,
			best: 2,
		});
	});
});

describe('completed habits', () => {
	it('freezes the day streak at the end date instead of decaying', () => {
		// Learned C# Mon-Fri, then marked the habit complete on the Friday.
		const habit = daily(
			['2024-06-03', '2024-06-04', '2024-06-05', '2024-06-06', '2024-06-07'],
			{ endDate: new Date(2024, 5, 7) }
		);

		// Weeks later, the record still reads 5 — the days after completion are
		// not counted as misses.
		expect(calculateDayStreaks(habit, new Date(2024, 6, 15))).toMatchObject({
			current: 5,
			best: 5,
			total: 5,
		});
	});

	it('freezes the week streak at the end date', () => {
		const habit = {
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 3,
			startDate: MON_JUN_3,
			endDate: new Date(2024, 5, 16),
			completions: [
				'2024-06-03', '2024-06-05', '2024-06-07',
				'2024-06-10', '2024-06-12', '2024-06-14',
			],
		};

		expect(calculateWeekStreaks(habit, new Date(2024, 6, 15))).toMatchObject({
			current: 2,
			best: 2,
			total: 2,
		});
	});
})

describe('a quit habit keeps its record', () => {
	it('preserves best and total after quitting mid-streak', () => {
		const habit = daily(['2024-06-03', '2024-06-04', '2024-06-05'], {
			endDate: new Date(2024, 5, 5),
			endReason: 'quit',
		});

		expect(calculateDayStreaks(habit, new Date(2024, 6, 1))).toMatchObject({
			current: 3,
			best: 3,
			total: 3,
		});
	});
})
