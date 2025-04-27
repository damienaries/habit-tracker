import Dexie from 'dexie';

export const db = new Dexie('HabitDB');

db.version(1).stores({
	habits: '++id, name, frequency, startDate, endDate, streak, completedDays',
});
