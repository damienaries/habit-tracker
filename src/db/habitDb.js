import Dexie from 'dexie';

export const db = new Dexie('HabitTrackerDB');

db.version(1).stores({
	habits: '++id, name, frequency, startDate, endDate, streak, completedDays',
	completions: '++id, habitId, date',
});
