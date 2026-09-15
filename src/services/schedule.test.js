import { describe, it, expect } from 'vitest';
import {
	FREQUENCY,
	isExpectedOn,
	shouldAppearOn,
	weeklyTarget,
	isPausedOn,
	isActiveOn,
} from './schedule';

const MON_JUN_3 = new Date(2024, 5, 3);
const TUE_JUN_4 = new Date(2024, 5, 4);
const WED_JUN_5 = new Date(2024, 5, 5);

describe('isExpectedOn', () => {
	it('expects a daily habit every day', () => {
		const habit = { frequency: FREQUENCY.DAILY, startDate: MON_JUN_3 };
		expect(isExpectedOn(habit, TUE_JUN_4)).toBe(true);
	});

	it('expects a fixed-day habit only on its days', () => {
		const habit = {
			frequency: FREQUENCY.SPECIFIC_DAYS,
			daysOfWeek: [2, 4],
			startDate: MON_JUN_3,
		};
		expect(isExpectedOn(habit, TUE_JUN_4)).toBe(true);
		expect(isExpectedOn(habit, WED_JUN_5)).toBe(false);
	});

	it('never expects a flexible weekly habit on a particular day', () => {
		const habit = { frequency: FREQUENCY.WEEKLY, timesPerPeriod: 3, startDate: MON_JUN_3 };
		expect(isExpectedOn(habit, TUE_JUN_4)).toBe(false);
	});

	it('does not expect anything before the start date or after the end date', () => {
		const habit = {
			frequency: FREQUENCY.DAILY,
			startDate: TUE_JUN_4,
			endDate: TUE_JUN_4,
		};
		expect(isExpectedOn(habit, MON_JUN_3)).toBe(false);
		expect(isExpectedOn(habit, TUE_JUN_4)).toBe(true);
		expect(isExpectedOn(habit, WED_JUN_5)).toBe(false);
	});

	it('does not expect a habit on paused days', () => {
		const habit = {
			frequency: FREQUENCY.DAILY,
			startDate: MON_JUN_3,
			pausedRanges: [{ from: '2024-06-04', to: '2024-06-04' }],
		};
		expect(isExpectedOn(habit, TUE_JUN_4)).toBe(false);
		expect(isExpectedOn(habit, WED_JUN_5)).toBe(true);
	});
});

describe('isPausedOn', () => {
	it('treats an open-ended range as still paused', () => {
		const habit = { pausedRanges: [{ from: '2024-06-04', to: null }] };
		expect(isPausedOn(habit, '2024-06-04')).toBe(true);
		expect(isPausedOn(habit, '2025-01-01')).toBe(true);
		expect(isPausedOn(habit, '2024-06-03')).toBe(false);
	});
});

describe('shouldAppearOn', () => {
	it('keeps a paused habit visible so it can be resumed', () => {
		const habit = {
			frequency: FREQUENCY.DAILY,
			startDate: MON_JUN_3,
			pausedRanges: [{ from: '2024-06-04', to: null }],
		};
		expect(isExpectedOn(habit, TUE_JUN_4)).toBe(false);
		expect(shouldAppearOn(habit, TUE_JUN_4)).toBe(true);
	});

	it('hides a flexible weekly habit once its target is met', () => {
		const habit = {
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 2,
			startDate: MON_JUN_3,
			completions: ['2024-06-03', '2024-06-04'],
		};
		expect(shouldAppearOn(habit, WED_JUN_5, 2)).toBe(false);
		expect(shouldAppearOn(habit, WED_JUN_5, 1)).toBe(true);
	});

	it('still shows a completed day after the weekly target is met', () => {
		const habit = {
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 2,
			startDate: MON_JUN_3,
			completions: ['2024-06-03', '2024-06-04'],
		};
		// This is the case that used to vanish: the day was completed, the target
		// is met, and the habit must still appear as done rather than disappear.
		expect(shouldAppearOn(habit, TUE_JUN_4, 2)).toBe(true);
	});

	it('shows a fixed-day habit only on its days', () => {
		const habit = {
			frequency: FREQUENCY.SPECIFIC_DAYS,
			daysOfWeek: [2],
			startDate: MON_JUN_3,
		};
		expect(shouldAppearOn(habit, TUE_JUN_4)).toBe(true);
		expect(shouldAppearOn(habit, WED_JUN_5)).toBe(false);
	});
});

describe('weeklyTarget', () => {
	it('uses timesPerPeriod for flexible weekly habits', () => {
		const habit = { frequency: FREQUENCY.WEEKLY, timesPerPeriod: 3, startDate: MON_JUN_3 };
		expect(weeklyTarget(habit, MON_JUN_3)).toBe(3);
	});

	it('counts the scheduled days for a fixed-day habit', () => {
		const habit = {
			frequency: FREQUENCY.SPECIFIC_DAYS,
			daysOfWeek: [2, 4],
			startDate: MON_JUN_3,
		};
		expect(weeklyTarget(habit, MON_JUN_3)).toBe(2);
	});

	it('counts only the days a daily habit was live for', () => {
		const habit = { frequency: FREQUENCY.DAILY, startDate: new Date(2024, 5, 6) };
		// Starts Thursday, so Thu/Fri/Sat/Sun of that week.
		expect(weeklyTarget(habit, MON_JUN_3)).toBe(4);
	});
});

describe('isActiveOn', () => {
	it('is unaffected by pause', () => {
		const habit = {
			frequency: FREQUENCY.DAILY,
			startDate: MON_JUN_3,
			pausedRanges: [{ from: '2024-06-04', to: null }],
		};
		expect(isActiveOn(habit, TUE_JUN_4)).toBe(true);
	});
});

describe('weeklyTarget for weeks the habit was not live', () => {
	const weekly = overrides => ({
		frequency: FREQUENCY.WEEKLY,
		timesPerPeriod: 3,
		startDate: MON_JUN_3,
		...overrides,
	});

	it('is zero after the habit was completed', () => {
		const habit = weekly({ endDate: new Date(2024, 5, 9) });
		expect(weeklyTarget(habit, MON_JUN_3)).toBe(3);
		expect(weeklyTarget(habit, new Date(2024, 5, 10))).toBe(0);
	});

	it('is zero before the habit started', () => {
		const habit = weekly({ startDate: new Date(2024, 5, 10) });
		expect(weeklyTarget(habit, MON_JUN_3)).toBe(0);
	});

	it('is zero for a week spent entirely paused', () => {
		const habit = weekly({ pausedRanges: [{ from: '2024-06-10', to: '2024-06-16' }] });
		expect(weeklyTarget(habit, new Date(2024, 5, 10))).toBe(0);
		expect(weeklyTarget(habit, MON_JUN_3)).toBe(3);
	});

	it('skips a week only partly paused rather than judging it', () => {
		// Paused Mon-Wed leaves four days to hit a three-times target. Scoring
		// that against the full target would punish the pause it was meant to
		// protect, so the week is skipped.
		const habit = weekly({ pausedRanges: [{ from: '2024-06-10', to: '2024-06-12' }] });
		expect(weeklyTarget(habit, new Date(2024, 5, 10))).toBe(0);
	});

	it('is zero for the week a habit is created partway through', () => {
		const habit = weekly({ startDate: new Date(2024, 5, 6) });
		expect(weeklyTarget(habit, MON_JUN_3)).toBe(0);
		expect(weeklyTarget(habit, new Date(2024, 5, 10))).toBe(3);
	});
});
