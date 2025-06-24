import Dexie from 'dexie';

export const db = new Dexie('HabitTrackerDB');

db.version(2).stores({
	users: '++id, name, createdAt, settings',
	habits:
		'++id, userId, name, frequency, startDate, endDate, lastDone, streak, timesPerPeriod, customInterval, weeklyCompletions, completedDates, isPaused',
});

// Helper to get start of week (Monday)
export function getStartOfWeek(date) {
	// Create a new date object and set to midnight
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);

	// Get the day of week (0 = Sunday, 1 = Monday, etc.)
	const day = d.getDay();

	// Calculate days to subtract to get to Monday
	// If Sunday (0), subtract 6 days to get to last Monday
	// Otherwise, subtract (day - 1) days to get to this week's Monday
	const daysToSubtract = day === 0 ? 6 : day - 1;

	// Set to Monday
	d.setDate(d.getDate() - daysToSubtract);

	return d;
}

// Get completions for current week
export function getWeeklyCompletions(habit, date) {
	const weekStart = getStartOfWeek(date);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	return (habit.weeklyCompletions || []).filter(completion => {
		const completionDate = new Date(completion);
		// Set both dates to midnight UTC for consistent comparison
		completionDate.setUTCHours(0, 0, 0, 0);
		const startUTC = new Date(weekStart);
		startUTC.setUTCHours(0, 0, 0, 0);
		const endUTC = new Date(weekEnd);
		endUTC.setUTCHours(0, 0, 0, 0);

		return completionDate >= startUTC && completionDate < endUTC;
	});
}

// Check if a habit should be shown today
export function shouldShowHabitToday(habit, date, referenceDate = new Date()) {
	if (habit.frequency !== 'weekly' || !habit.timesPerPeriod) {
		return true;
	}

	// Set both dates to midnight UTC for consistent comparison
	const today = new Date(referenceDate);
	today.setUTCHours(0, 0, 0, 0);
	const checkDate = new Date(date);
	checkDate.setUTCHours(0, 0, 0, 0);
	const isPast = checkDate < today;

	const completions = habit.weeklyCompletions || [];
	const completedToday = completions.some(d => {
		const completionDate = new Date(d);
		completionDate.setUTCHours(0, 0, 0, 0);
		return completionDate.getTime() === checkDate.getTime();
	});

	// Get completions for the week of 'date'
	const weekCompletions = getWeeklyCompletions(habit, date);
	const completionsThisWeek = weekCompletions.length;

	if (isPast) {
		// For past days, show only if completed that day
		return completedToday;
	} else {
		// For today/future, show if:
		// 1. Weekly target not yet met, OR
		// 2. This specific day was completed
		return completionsThisWeek < habit.timesPerPeriod || completedToday;
	}
}

// Update habit completion (works for both daily and weekly)
export async function toggleHabitCompletion(habit, date) {
	const today = new Date(date);
	today.setHours(0, 0, 0, 0);

	// Use completedDates for daily, weeklyCompletions for weekly
	const isWeekly = habit.frequency === 'weekly' && habit.timesPerPeriod;
	const completionsKey = isWeekly ? 'weeklyCompletions' : 'completedDates';
	const completions = (habit[completionsKey] || []).map(d => new Date(d));
	const todayTime = today.getTime();
	const isCompleted = completions.some(d => d.getTime() === todayTime);

	if (isCompleted) {
		// Uncomplete: remove only this date
		const newCompletions = (habit[completionsKey] || []).filter(
			d => new Date(d).getTime() !== todayTime
		);
		await db.habits.update(habit.id, {
			[completionsKey]: newCompletions,
			lastDone:
				newCompletions.length > 0
					? new Date(Math.max(...newCompletions.map(d => new Date(d).getTime())))
					: null,
			streak: Math.max(0, habit.streak - 1),
		});
	} else {
		// Complete: add this date if not present
		const newCompletions = [...(habit[completionsKey] || []), today];
		await db.habits.update(habit.id, {
			[completionsKey]: newCompletions,
			lastDone: today,
			streak: habit.streak + 1,
		});
	}
}

// Helper function to ensure dates are stored as Date objects
export function ensureDateObject(date) {
	if (!date) return null;
	if (date instanceof Date) return date;
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

	const sampleHabits = [
		{
			userId,
			name: 'Morning Meditation',
			frequency: 'daily',
			startDate: today,
			details: '10 minutes of mindfulness',
			streak: 3,
			completedDates: [today],
		},
		{
			userId,
			name: 'Exercise',
			frequency: 'weekly',
			timesPerPeriod: 3,
			startDate: today,
			details: '30 minutes of cardio or strength training',
			streak: 2,
			weeklyCompletions: [
				new Date(today.getTime() - 24 * 60 * 60 * 1000), // yesterday
			],
		},
		{
			userId,
			name: 'Read',
			frequency: 'daily',
			startDate: today,
			details: 'Read for 20 minutes',
			streak: 5,
			completedDates: [],
		},
	];

	await db.habits.bulkAdd(sampleHabits);
	console.log('🌱 Database reset with sample data');
}

// Attach to window in development for easy access
if (import.meta.env.DEV) {
	window.dbClear = dbClear;
	window.dbFreshSeed = dbFreshSeed;
}
