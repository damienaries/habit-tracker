import { db, shouldShowHabitToday } from '../db/habitDb';

function getUTCDateString(date) {
	return new Date(date).toISOString().slice(0, 10);
}

export async function getHabitsForDate(date) {
	// Ensure date is at midnight
	const cardDate = new Date(date);
	cardDate.setHours(0, 0, 0, 0);
	const cardDateStr = getUTCDateString(cardDate);

	const habits = await db.habits.toArray();
	const activeHabits = [];

	for (const habit of habits) {
		const startDate = new Date(habit.startDate);
		const startDateStr = getUTCDateString(startDate);

		const endDate = habit.endDate ? new Date(habit.endDate) : null;
		const endDateStr = endDate ? getUTCDateString(endDate) : null;

		// Check if habit is active on this date (compare only date portion in UTC)
		if (
			cardDateStr < startDateStr ||
			(endDateStr && cardDateStr > endDateStr)
		) {
			continue;
		}

		// Check if habit should be shown based on frequency and completions
		const shouldShow = shouldShowHabitToday(habit, cardDate);
		if (shouldShow) {
			activeHabits.push(habit);
		}
	}

	return activeHabits;
}
