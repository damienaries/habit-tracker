import { db } from '../db/habitDb';
import { getUniqueDateIdentifier, getStartOfWeek } from '../utils/dateHelpers';

export async function getHabitsForDate(date) {
	// Ensure date is at midnight
	const cardDate = new Date(date);
	cardDate.setHours(0, 0, 0, 0);
	const cardDateStr = getUniqueDateIdentifier(cardDate);

	const habits = await db.habits.toArray();
	const activeHabits = [];

	for (const habit of habits) {
		const startDate = new Date(habit.startDate);
		const startDateStr = getUniqueDateIdentifier(startDate);

		const endDate = habit.endDate ? new Date(habit.endDate) : null;
		const endDateStr = endDate ? getUniqueDateIdentifier(endDate) : null;

		// Check if habit is active on this date (compare only date portion in UTC)
		if (
			cardDateStr < startDateStr ||
			(endDateStr && cardDateStr > endDateStr)
		) {
			continue;
		}

		// For weekly habits, check if this specific day should show
		if (habit.frequency === 'weekly' && habit.timesPerPeriod) {
			const completions = habit.weeklyCompletions || [];
			const completedToday = completions.some((d) => {
				const completionDate = new Date(d);
				completionDate.setUTCHours(0, 0, 0, 0);
				return completionDate.getTime() === cardDate.getTime();
			});

			// Show if either:
			// 1. This specific day was completed
			// 2. The weekly target hasn't been met yet
			const weekCompletions = completions.filter((completion) => {
				const completionDate = new Date(completion);
				completionDate.setUTCHours(0, 0, 0, 0);
				const weekStart = getStartOfWeek(cardDate);
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekEnd.getDate() + 7);
				return completionDate >= weekStart && completionDate < weekEnd;
			});

			if (!completedToday && weekCompletions.length >= habit.timesPerPeriod) {
				continue;
			}
		}

		activeHabits.push(habit);
	}

	return activeHabits;
}
