import { db } from '../db/habitDb';
import { habitsForDay } from './dayStatus';

export async function getHabitsForDate(date, userId) {
	if (!userId) {
		throw new Error('User ID is required');
	}

	const habits = await db.habits.where('userId').equals(userId).toArray();
	return habitsForDay(habits, date);
}
