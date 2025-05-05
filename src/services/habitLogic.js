import { getStartOfWeek, getEndOfWeek } from '../utils/dateHelpers';
import { db } from '../db/habitDb';

export async function getHabitsForDate(date = new Date()) {
	const allHabits = await db.habits.toArray();
	const completions = await db.completions.toArray();

	const startOfWeek = getStartOfWeek(date);
	const endOfWeek = getEndOfWeek(date);

	return allHabits.filter((habit) => {
		const start = habit.startDate;
		const end = habit.endDate ? habit.endDate : null;
		const isInRange = date >= start && (!end || date <= end);

		if (!isInRange) return false;

		const completionsForHabit = completions.filter(
			(completion) => completion.habitId === habit.id
		);

		if (habit.frequency === 'daily') {
			return true;
		}

		if (habit.frequency === 'weekly' && habit.timesPerPeriod) {
			const countThisWeek = completionsForHabit.filter((completion) => {
				return completion.date >= startOfWeek && completion.date <= endOfWeek;
			}).length;

			return countThisWeek < habit.timesPerPeriod;
		}

		return false;
	});
}
