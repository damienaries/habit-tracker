import { describe, it, expect } from 'vitest';
import { getDayStatus, habitsForDay, completionsInWeekOf } from './dayStatus';
import { FREQUENCY } from './schedule';

const MON_JUN_3 = new Date(2024, 5, 3);
const TUE_JUN_4 = new Date(2024, 5, 4);
const WED_JUN_5 = new Date(2024, 5, 5);

const daily = (name, completions = []) => ({
	id: name,
	name,
	frequency: FREQUENCY.DAILY,
	startDate: MON_JUN_3,
	completions,
});

describe('getDayStatus', () => {
	it('marks a fully completed past day', () => {
		const habits = [daily('a', ['2024-06-03']), daily('b', ['2024-06-03'])];
		expect(getDayStatus(habits, MON_JUN_3, WED_JUN_5)).toBe('completed');
	});

	it('marks a partially completed past day', () => {
		const habits = [daily('a', ['2024-06-03']), daily('b', [])];
		expect(getDayStatus(habits, MON_JUN_3, WED_JUN_5)).toBe('partial');
	});

	it('marks a missed past day', () => {
		const habits = [daily('a', []), daily('b', [])];
		expect(getDayStatus(habits, MON_JUN_3, WED_JUN_5)).toBe('incomplete');
	});

	it('does not call today a miss', () => {
		const habits = [daily('a', [])];
		expect(getDayStatus(habits, WED_JUN_5, WED_JUN_5)).toBe('today-pending');
	});

	it('reports future days as future', () => {
		const habits = [daily('a', [])];
		expect(getDayStatus(habits, WED_JUN_5, MON_JUN_3)).toBe('future');
	});

	it('reports no-habits when nothing was scheduled', () => {
		const habits = [
			{
				id: 'weekend',
				frequency: FREQUENCY.SPECIFIC_DAYS,
				daysOfWeek: [6, 0],
				startDate: MON_JUN_3,
				completions: [],
			},
		];
		expect(getDayStatus(habits, TUE_JUN_4, WED_JUN_5)).toBe('no-habits');
	});

	it('shows but does not judge a paused habit', () => {
		const habits = [
			daily('paused', []),
			{ ...daily('paused2', []), pausedRanges: [{ from: '2024-06-03', to: null }] },
		];
		// Only the unpaused habit is judged, and it was missed.
		expect(getDayStatus(habits, MON_JUN_3, WED_JUN_5)).toBe('incomplete');

		const allPaused = [
			{ ...daily('p', []), pausedRanges: [{ from: '2024-06-03', to: null }] },
		];
		expect(getDayStatus(allPaused, MON_JUN_3, WED_JUN_5)).toBe('no-habits');
	});

	it('ignores days before the habit started', () => {
		const habits = [daily('a', [])];
		expect(getDayStatus(habits, new Date(2024, 5, 1), WED_JUN_5)).toBe('no-habits');
	});
});

describe('habitsForDay', () => {
	it('drops a flexible weekly habit once the week target is met', () => {
		const habit = {
			id: 'gym',
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 2,
			startDate: MON_JUN_3,
			completions: ['2024-06-03', '2024-06-04'],
		};
		expect(habitsForDay([habit], WED_JUN_5)).toHaveLength(0);
		// ...but the days it was actually done still show it.
		expect(habitsForDay([habit], TUE_JUN_4)).toHaveLength(1);
	});
});

describe('completionsInWeekOf', () => {
	it('counts only completions inside that Monday-to-Sunday week', () => {
		const habit = {
			completions: ['2024-06-02', '2024-06-03', '2024-06-09', '2024-06-10'],
		};
		// Week of Jun 3 runs Mon 3 to Sun 9.
		expect(completionsInWeekOf(habit, WED_JUN_5)).toBe(2);
	});
});

describe('flexible weekly habits do not fail individual days', () => {
	const gym = completions => ({
		id: 'gym',
		frequency: FREQUENCY.WEEKLY,
		timesPerPeriod: 3,
		startDate: MON_JUN_3,
		completions,
	});

	it('does not mark a day missed just because the week fell short', () => {
		// Only one of three done that week. The other days were never owed.
		const habits = [gym(['2024-06-03'])];
		expect(getDayStatus(habits, TUE_JUN_4, new Date(2024, 5, 20))).toBe('no-habits');
	});

	it('still credits the days it was done', () => {
		const habits = [gym(['2024-06-03'])];
		expect(getDayStatus(habits, MON_JUN_3, new Date(2024, 5, 20))).toBe('completed');
	});

	it('does not let a weekly habit mask a missed daily one', () => {
		const habits = [gym(['2024-06-04']), daily('read', [])];
		expect(getDayStatus(habits, TUE_JUN_4, new Date(2024, 5, 20))).toBe('partial');
	});
});
