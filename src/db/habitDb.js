import Dexie from 'dexie';
import { isSameDay } from '../utils/dateHelpers';

export const db = new Dexie('HabitTrackerDB');

db.version(1).stores({
	habits:
		'++id, name, frequency, startDate, endDate, lastDone, streak, timesPerPeriod, customInterval, weeklyCompletions, completedDates',
});

// Helper to get start of week (Monday)
export function getStartOfWeek(date) {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

// Get completions for current week
export function getWeeklyCompletions(habit, date) {
	const weekStart = getStartOfWeek(date);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	return (habit.weeklyCompletions || []).filter((completion) => {
		const completionDate = new Date(completion);
		return completionDate >= weekStart && completionDate < weekEnd;
	});
}

// Check if a habit should be shown today
export function shouldShowHabitToday(habit, date) {
	if (habit.frequency !== 'weekly' || !habit.timesPerPeriod) {
		return true;
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const isPast = date < today;

	const completions = habit.weeklyCompletions || [];
	const completedToday = completions.some((d) => isSameDay(new Date(d), date));

	// Get completions for the week of 'date'
	const weekCompletions = getWeeklyCompletions(habit, date);
	const completionsThisWeek = weekCompletions.length;

	if (isPast) {
		// For past days, show only if completed that day
		return completedToday;
	} else {
		// For today/future, show only if weekly target not yet met
		return completionsThisWeek < habit.timesPerPeriod;
	}
}

// Update habit completion (works for both daily and weekly)
export async function toggleHabitCompletion(habit, date) {
	const today = new Date(date);
	today.setHours(0, 0, 0, 0);

	// Use completedDates for daily, weeklyCompletions for weekly
	const isWeekly = habit.frequency === 'weekly' && habit.timesPerPeriod;
	const completionsKey = isWeekly ? 'weeklyCompletions' : 'completedDates';
	const completions = (habit[completionsKey] || []).map((d) =>
		new Date(d).getTime()
	);
	const todayTime = today.getTime();
	const isCompleted = completions.includes(todayTime);

	if (isCompleted) {
		// Uncomplete: remove only this date
		const newCompletions = (habit[completionsKey] || []).filter(
			(d) => new Date(d).getTime() !== todayTime
		);
		await db.habits.update(habit.id, {
			[completionsKey]: newCompletions,
			lastDone:
				newCompletions.length > 0
					? new Date(
							Math.max(...newCompletions.map((d) => new Date(d).getTime()))
					  )
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
// DB HELPER FUNCTIONS

export async function dbClear() {
	await db.habits.clear();
	console.log('🧹 Database cleared');
}

export async function dbFreshSeed() {
	await dbClear();

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const sampleHabits = [
		{
			name: 'Morning Meditation',
			frequency: 'daily',
			startDate: today,
			details: '10 minutes of mindfulness',
			streak: 3,
			completedDates: [today],
		},
		{
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
