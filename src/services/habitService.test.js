import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, toggleHabitCompletion } from '../db/habitDb';
import { createHabit, pauseHabit, resumeHabit, getHabit } from './habitService';
import { isPausedNow, FREQUENCY } from './schedule';
import { getLocalDateKey } from '../utils/dateHelpers';

describe('pause and resume', () => {
	let id;

	beforeEach(async () => {
		await db.open();
		await db.habits.clear();
		id = await createHabit({
			userId: 1,
			name: 'Read',
			frequency: FREQUENCY.DAILY,
			startDate: new Date(),
		});
	});

	afterEach(async () => {
		await db.habits.clear();
	});

	it('marks the habit paused from the day it is paused', async () => {
		await pauseHabit(id);
		expect(isPausedNow(await getHabit(id))).toBe(true);
	});

	it('resumes it the same day rather than at midnight', async () => {
		await pauseHabit(id);
		await resumeHabit(id);
		// Regression: the range end is inclusive, so closing it at today left
		// the habit paused and its checkbox disabled for the rest of the day.
		expect(isPausedNow(await getHabit(id))).toBe(false);
	});

	it('keeps an earlier pause in the history when resumed', async () => {
		await pauseHabit(id, new Date(2024, 5, 3));
		await resumeHabit(id, new Date(2024, 5, 6));

		const habit = await getHabit(id);
		expect(habit.pausedRanges).toEqual([{ from: '2024-06-03', to: '2024-06-05' }]);
	});
});

describe('toggleHabitCompletion', () => {
	let id;

	beforeEach(async () => {
		await db.open();
		await db.habits.clear();
		id = await createHabit({
			userId: 1,
			name: 'Read',
			frequency: FREQUENCY.DAILY,
			startDate: new Date(),
		});
	});

	it('adds and removes the day', async () => {
		const today = getLocalDateKey(new Date());

		await toggleHabitCompletion(await getHabit(id), new Date());
		expect((await getHabit(id)).completions).toEqual([today]);

		await toggleHabitCompletion(await getHabit(id), new Date());
		expect((await getHabit(id)).completions).toEqual([]);
	});

	it('does not drop a write made from a stale copy of the habit', async () => {
		// Two views hold the same habit; one checks off Monday, the other then
		// checks off Tuesday from its now-outdated copy.
		const stale = await getHabit(id);

		await toggleHabitCompletion(stale, new Date(2024, 5, 3));
		await toggleHabitCompletion(stale, new Date(2024, 5, 4));

		expect((await getHabit(id)).completions).toEqual(['2024-06-03', '2024-06-04']);
	});
});

describe('createHabit validation', () => {
	beforeEach(async () => {
		await db.open();
		await db.habits.clear();
	});

	it('refuses a fixed-day habit with no days', async () => {
		await expect(
			createHabit({
				userId: 1,
				name: 'Weekend writing',
				frequency: FREQUENCY.SPECIFIC_DAYS,
				startDate: new Date(),
				daysOfWeek: [],
			})
		).rejects.toThrow(/at least one day/i);
	});
});
