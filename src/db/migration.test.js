import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { applyV3Upgrade } from './habitDb';
import { getLocalDateKey } from '../utils/dateHelpers';

const V2_SCHEMA = {
	users: '++id, name, createdAt, settings',
	habits:
		'++id, userId, name, frequency, startDate, endDate, lastDone, streak, timesPerPeriod, customInterval, weeklyCompletions, completedDates, isPaused',
};

const V3_SCHEMA = {
	users: '++id, name, createdAt, settings',
	habits: '++id, userId, name, frequency, startDate, endDate, timesPerPeriod',
};

// Stands up a real v2 database with v2-shaped rows, then reopens it with the v3
// schema so the upgrade runs the way it will on the user's device.
async function migrate(v2Habits) {
	const before = new Dexie('MigrationTestDB');
	before.version(2).stores(V2_SCHEMA);
	await before.open();
	await before.habits.bulkAdd(v2Habits);
	before.close();

	const after = new Dexie('MigrationTestDB');
	after.version(2).stores(V2_SCHEMA);
	after.version(3).stores(V3_SCHEMA).upgrade(applyV3Upgrade);
	await after.open();
	const rows = await after.habits.toArray();
	after.close();

	return rows;
}

describe('v2 to v3 migration', () => {
	beforeEach(async () => {
		await Dexie.delete('MigrationTestDB');
		localStorage.clear();
	});

	it('merges both completion arrays into local date keys', async () => {
		const [habit] = await migrate([
			{
				userId: 1,
				name: 'Read',
				frequency: 'daily',
				startDate: new Date(2024, 5, 3),
				streak: 7,
				completedDates: [new Date(2024, 5, 3), new Date(2024, 5, 4)],
				weeklyCompletions: [],
			},
		]);

		expect(habit.completions).toEqual(['2024-06-03', '2024-06-04']);
		expect(habit.completedDates).toBeUndefined();
		expect(habit.weeklyCompletions).toBeUndefined();
		expect(habit.streak).toBeUndefined();
	});

	it('keeps weekly completions and drops duplicates across the two arrays', async () => {
		const [habit] = await migrate([
			{
				userId: 1,
				name: 'Gym',
				frequency: 'weekly',
				timesPerPeriod: 3,
				startDate: new Date(2024, 5, 3),
				completedDates: [new Date(2024, 5, 3)],
				weeklyCompletions: [new Date(2024, 5, 3), new Date(2024, 5, 5)],
			},
		]);

		expect(habit.completions).toEqual(['2024-06-03', '2024-06-05']);
		expect(habit.frequency).toBe('weekly');
		expect(habit.timesPerPeriod).toBe(3);
	});

	it('converts unimplemented frequencies to daily, preserving how they behaved', async () => {
		const habits = await migrate([
			{ userId: 1, name: 'A', frequency: 'monthly', timesPerPeriod: 2, startDate: new Date() },
			{ userId: 1, name: 'B', frequency: 'every_n_days', customInterval: 3, startDate: new Date() },
		]);

		expect(habits.map(h => h.frequency)).toEqual(['daily', 'daily']);
		expect(habits.every(h => h.customInterval === undefined)).toBe(true);
	});

	it('turns a paused flag into an open-ended pause range', async () => {
		const [habit] = await migrate([
			{ userId: 1, name: 'Paused', frequency: 'daily', startDate: new Date(), isPaused: true },
		]);

		expect(habit.pausedRanges).toHaveLength(1);
		expect(habit.pausedRanges[0]).toEqual({ from: getLocalDateKey(new Date()), to: null });
		expect(habit.isPaused).toBeUndefined();
	});

	it('leaves an unpaused habit with no pause ranges', async () => {
		const [habit] = await migrate([
			{ userId: 1, name: 'Fine', frequency: 'daily', startDate: new Date(), isPaused: false },
		]);

		expect(habit.pausedRanges).toEqual([]);
	});

	it('adds the schedule fields every habit now carries', async () => {
		const [habit] = await migrate([
			{ userId: 1, name: 'Read', frequency: 'daily', startDate: new Date() },
		]);

		expect(habit).toMatchObject({ daysOfWeek: null, durationMinutes: null, timeOfDay: null });
	});

	it('backs up the original rows before touching them', async () => {
		await migrate([
			{
				userId: 1,
				name: 'Read',
				frequency: 'daily',
				startDate: new Date(2024, 5, 3),
				streak: 9,
				completedDates: [new Date(2024, 5, 3)],
			},
		]);

		const backup = JSON.parse(localStorage.getItem('habitBackup:v2'));
		expect(backup.habits).toHaveLength(1);
		expect(backup.habits[0].streak).toBe(9);
		expect(backup.habits[0].completedDates).toHaveLength(1);
	});

	it('preserves user profiles and the habit-to-profile link', async () => {
		const [habit] = await migrate([
			{ userId: 42, name: 'Read', frequency: 'daily', startDate: new Date() },
		]);

		expect(habit.userId).toBe(42);
	});
});

describe('end reason backfill', () => {
	beforeEach(async () => {
		await Dexie.delete('MigrationTestDB');
		localStorage.clear();
	});

	it('treats an already-ended habit as completed', async () => {
		const [habit] = await migrate([
			{
				userId: 1,
				name: 'Learn C#',
				frequency: 'daily',
				startDate: new Date(2024, 5, 3),
				endDate: new Date(2024, 5, 20),
			},
		]);
		expect(habit.endReason).toBe('completed');
	});

	it('leaves a live habit with no end reason', async () => {
		const [habit] = await migrate([
			{ userId: 1, name: 'Read', frequency: 'daily', startDate: new Date() },
		]);
		expect(habit.endReason).toBeNull();
	});
});

describe('weekly habits with no target', () => {
	beforeEach(async () => {
		await Dexie.delete('MigrationTestDB');
		localStorage.clear();
	});

	it('becomes daily, matching how it actually behaved before v3', async () => {
		// Pre-v3 the times-per-week field was optional, and the day-card logic
		// required both 'weekly' and a target — so these showed every day.
		// Carrying the label over would have scored them as once a week.
		const [habit] = await migrate([
			{
				userId: 1,
				name: 'Stretch',
				frequency: 'weekly',
				timesPerPeriod: null,
				startDate: new Date(2024, 5, 3),
			},
		]);

		expect(habit.frequency).toBe('daily');
		expect(habit.timesPerPeriod).toBeNull();
	});

	it('keeps a weekly habit that does have a target', async () => {
		const [habit] = await migrate([
			{
				userId: 1,
				name: 'Gym',
				frequency: 'weekly',
				timesPerPeriod: 3,
				startDate: new Date(2024, 5, 3),
			},
		]);

		expect(habit.frequency).toBe('weekly');
		expect(habit.timesPerPeriod).toBe(3);
	});
});
