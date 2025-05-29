import { describe, it, expect, vi } from 'vitest';
import {
	getStartOfWeek,
	getWeeklyCompletions,
	shouldShowHabitToday,
} from './habitDb';

// Mock import.meta.env.DEV to be false during tests
vi.mock('vite', () => ({
	env: {
		DEV: false,
	},
}));

describe('Habit DB Logic', () => {
	it('getStartOfWeek returns Monday for any day in the week', () => {
		// Test dates in local timezone
		const monday = new Date(2024, 5, 3); // June 3, 2024 (Monday)
		const tuesday = new Date(2024, 5, 4); // June 4, 2024 (Tuesday)
		const wednesday = new Date(2024, 5, 5); // June 5, 2024 (Wednesday)
		const thursday = new Date(2024, 5, 6); // June 6, 2024 (Thursday)
		const friday = new Date(2024, 5, 7); // June 7, 2024 (Friday)
		const saturday = new Date(2024, 5, 8); // June 8, 2024 (Saturday)
		const sunday = new Date(2024, 5, 9); // June 9, 2024 (Sunday)

		// Set all times to midnight
		[monday, tuesday, wednesday, thursday, friday, saturday, sunday].forEach(
			(date) => date.setHours(0, 0, 0, 0)
		);

		// All days should return the same Monday
		const expectedMonday = new Date(2024, 5, 3); // June 3, 2024
		expectedMonday.setHours(0, 0, 0, 0);

		expect(getStartOfWeek(monday).getTime()).toBe(expectedMonday.getTime());
		expect(getStartOfWeek(tuesday).getTime()).toBe(expectedMonday.getTime());
		expect(getStartOfWeek(wednesday).getTime()).toBe(expectedMonday.getTime());
		expect(getStartOfWeek(thursday).getTime()).toBe(expectedMonday.getTime());
		expect(getStartOfWeek(friday).getTime()).toBe(expectedMonday.getTime());
		expect(getStartOfWeek(saturday).getTime()).toBe(expectedMonday.getTime());
		expect(getStartOfWeek(sunday).getTime()).toBe(expectedMonday.getTime());

		// Verify it's actually Monday
		expect(getStartOfWeek(monday).getDay()).toBe(1); // Monday is 1
	});

	it('getWeeklyCompletions returns only completions in the same week', () => {
		const habit = {
			weeklyCompletions: [
				'2024-06-03T00:00:00.000Z', // Monday
				'2024-06-04T00:00:00.000Z', // Tuesday
				'2024-06-10T00:00:00.000Z', // Next Monday
			],
		};
		const tuesday = new Date('2024-06-04T00:00:00.000Z');
		const completions = getWeeklyCompletions(habit, tuesday);

		expect(completions.length).toBe(2);
		expect(completions).toEqual([
			'2024-06-03T00:00:00.000Z',
			'2024-06-04T00:00:00.000Z',
		]);
	});

	it('shouldShowHabitToday shows weekly habit on today if target not met', () => {
		const habit = {
			frequency: 'weekly',
			timesPerPeriod: 3,
			weeklyCompletions: [
				'2024-06-03T00:00:00.000Z', // Monday
				'2024-06-04T00:00:00.000Z', // Tuesday
			],
		};
		const wednesday = new Date('2024-06-05T00:00:00.000Z');
		// Today is Wednesday, target is 3, only 2 completions so far
		expect(shouldShowHabitToday(habit, wednesday, wednesday)).toBe(true);
	});

	it('shouldShowHabitToday hides weekly habit on today if target met', () => {
		const habit = {
			frequency: 'weekly',
			timesPerPeriod: 2,
			weeklyCompletions: [
				'2024-06-03T00:00:00.000Z', // Monday
				'2024-06-04T00:00:00.000Z', // Tuesday
			],
		};
		const wednesday = new Date('2024-06-05T00:00:00.000Z');
		// Today is Wednesday, target is 2, 2 completions so far
		expect(shouldShowHabitToday(habit, wednesday, wednesday)).toBe(false);
	});

	it('shouldShowHabitToday always returns true for daily habits', () => {
		const habit = {
			frequency: 'daily',
			completedDates: ['2024-06-03T00:00:00.000Z'],
		};
		const monday = new Date('2024-06-03T00:00:00.000Z');
		const tuesday = new Date('2024-06-04T00:00:00.000Z');
		const wednesday = new Date('2024-06-05T00:00:00.000Z');

		expect(shouldShowHabitToday(habit, monday)).toBe(true);
		expect(shouldShowHabitToday(habit, tuesday)).toBe(true);
		expect(shouldShowHabitToday(habit, wednesday)).toBe(true);
	});
});
