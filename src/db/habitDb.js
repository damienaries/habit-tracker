import Dexie from 'dexie';
import { getLocalDateKey } from '../utils/dateHelpers';

export const db = new Dexie('HabitTrackerDB');

db.version(2).stores({
	users: '++id, name, createdAt, settings',
	habits:
		'++id, userId, name, frequency, startDate, endDate, lastDone, streak, timesPerPeriod, customInterval, weeklyCompletions, completedDates, isPaused',
});

// v3 reshapes habits around a schedule rather than a frequency label:
//   - completedDates + weeklyCompletions collapse into one `completions` array
//     of 'YYYY-MM-DD' local date keys. Storing keys instead of Date objects is
//     what removes the local-vs-UTC midnight mismatches for good.
//   - daysOfWeek / durationMinutes / timeOfDay describe when a habit happens,
//     which is what both fixed-day habits and calendar export need.
//   - isPaused becomes pausedRanges, so a pause can be told apart from a miss
//     when streaks are recalculated over history.
//   - streak and completedDays are dropped; both are derived now.
export async function applyV3Upgrade(tx) {
	const today = getLocalDateKey(new Date());

	// Keep a verbatim copy of the pre-migration rows. The upgrade drops fields,
	// and Dexie runs it automatically on first load after deploy — this is the
	// only way back if the transform gets something wrong.
	try {
		const before = await tx.table('habits').toArray();
		localStorage.setItem(
			'habitBackup:v2',
			JSON.stringify({ savedAt: new Date().toISOString(), habits: before })
		);
	} catch (error) {
		console.error('Could not back up habits before migrating:', error);
	}

	await tx
		.table('habits')
		.toCollection()
		.modify(habit => {
			const merged = [
				...(habit.completedDates || []),
				...(habit.weeklyCompletions || []),
			].map(getLocalDateKey);

			habit.completions = [...new Set(merged)].sort();

			// monthly and every_n_days were never implemented, and 'weekly' with
			// no target was treated as daily too — all of them showed up every
			// day, so daily preserves the observed behaviour.
			if (habit.frequency !== 'weekly' || !habit.timesPerPeriod) {
				habit.frequency = 'daily';
				habit.timesPerPeriod = null;
			}

			habit.daysOfWeek = habit.daysOfWeek || null;
			habit.durationMinutes = habit.durationMinutes || null;
			habit.timeOfDay = habit.timeOfDay || null;
			habit.pausedRanges = habit.isPaused ? [{ from: today, to: null }] : [];
			// Pre-v3 there was only endDate, with no record of why it ended.
			habit.endReason = habit.endDate ? 'completed' : null;

			delete habit.completedDates;
			delete habit.weeklyCompletions;
			delete habit.isPaused;
			delete habit.customInterval;
			delete habit.streak;
			delete habit.completedDays;
			delete habit.lastDone;
		});
}

db.version(3)
	.stores({
		users: '++id, name, createdAt, settings',
		habits: '++id, userId, name, frequency, startDate, endDate, timesPerPeriod',
	})
	.upgrade(applyV3Upgrade);

// v4 adds one-off todos. They live in their own table rather than sharing the
// habit one: a todo has a due date and a done state and nothing else, while a
// habit carries a schedule, streaks, pause history and an end reason.
// Both feed the weekly success rate, which reads from each in turn.
db.version(4).stores({
	users: '++id, name, createdAt, settings',
	habits: '++id, userId, name, frequency, startDate, endDate, timesPerPeriod',
	todos: '++id, userId, dueDate, completedOn',
});

// Toggle a habit's completion for one day. Completions are local date keys, so
// there is no time component to get wrong. Streaks are derived from this array
// rather than tracked alongside it — see services/streaks.js.
export async function toggleHabitCompletion(habit, date) {
	const key = getLocalDateKey(date);

	// Re-read inside a transaction: the habit passed in came from a cache that
	// another view may already have moved on from.
	await db.transaction('rw', db.habits, async () => {
		const current = await db.habits.get(habit.id);
		if (!current) return;

		const completions = current.completions || [];
		const next = completions.includes(key)
			? completions.filter(d => d !== key)
			: [...completions, key].sort();

		await db.habits.update(habit.id, { completions: next });
	});
}

// Helper function to ensure dates are stored as Date objects
export function ensureDateObject(date) {
	if (!date) return null;
	if (date instanceof Date) return date;

	// A bare 'YYYY-MM-DD' (what a date input gives us) is parsed as UTC
	// midnight by the Date constructor, which is the previous day west of UTC.
	// Read it as the calendar date the user picked.
	if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
		const [year, month, day] = date.split('-').map(Number);
		return new Date(year, month - 1, day);
	}

	return new Date(date);
}

// Helper function to ensure dates are stored consistently
export function normalizeDate(date) {
	const d = ensureDateObject(date);
	if (!d) return null;
	d.setHours(0, 0, 0, 0);
	return d;
}

// DB HELPER FUNCTIONS

export async function dbClear() {
	await db.habits.clear();
	await db.users.clear();
	localStorage.removeItem('currentUserId');
	console.log('🧹 Database cleared');
}

export async function dbFreshSeed() {
	await dbClear();

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Create a test user
	const userId = await db.users.add({
		name: 'Test User',
		createdAt: today,
		settings: {
			morningNotifications: true,
			eveningNotifications: true,
		},
	});

	const todayKey = getLocalDateKey(today);
	const yesterdayKey = getLocalDateKey(new Date(today.getTime() - 24 * 60 * 60 * 1000));

	const sampleHabits = [
		{
			userId,
			name: 'Morning Meditation',
			frequency: 'daily',
			startDate: today,
			details: '10 minutes of mindfulness',
			completions: [todayKey],
			daysOfWeek: null,
			durationMinutes: 10,
			timeOfDay: '07:00',
			pausedRanges: [],
		},
		{
			userId,
			name: 'Exercise',
			frequency: 'weekly',
			timesPerPeriod: 3,
			startDate: today,
			details: '30 minutes of cardio or strength training',
			completions: [yesterdayKey],
			daysOfWeek: null,
			durationMinutes: 30,
			timeOfDay: null,
			pausedRanges: [],
		},
		{
			userId,
			name: 'Write for video game project',
			frequency: 'specificDays',
			daysOfWeek: [6, 0],
			startDate: today,
			details: 'Weekend writing block',
			completions: [],
			durationMinutes: 30,
			timeOfDay: '10:00',
			pausedRanges: [],
		},
	];

	await db.habits.bulkAdd(sampleHabits);

	// Point the stored session at the profile we just made, otherwise the app
	// reloads onto onboarding with a localStorage id that no longer resolves.
	localStorage.setItem('currentUserId', String(userId));
	console.log('🌱 Database reset with sample data');
}

// Attach to window in development for easy access
if (import.meta.env.DEV) {
	window.dbClear = dbClear;
	window.dbFreshSeed = dbFreshSeed;
}
