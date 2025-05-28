import { db } from '../db/habitDb';

// Clear all data from the database
export async function clearDatabase() {
	await db.habits.clear();
	await db.weeklyProgress?.clear();
	console.log('🧹 Database cleared');
}

// Reset database with sample data
export async function resetWithSampleData() {
	await clearDatabase();

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const sampleHabits = [
		{
			name: 'Morning Meditation',
			frequency: 'daily',
			startDate: today,
			details: '10 minutes of mindfulness',
			streak: 3,
			lastDone: new Date(today.getTime() - 24 * 60 * 60 * 1000), // yesterday
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
		},
	];

	await db.habits.bulkAdd(sampleHabits);
	console.log('🌱 Database reset with sample data');
}

// Add to window object if we're in development
if (import.meta.env.DEV) {
	window.devSeeder = {
		clearDatabase,
		resetWithSampleData,
	};
}
