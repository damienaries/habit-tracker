import { isSameDay } from '../utils/dateHelpers';
import HabitCheckbox from './HabitCheckbox';
import Icon from './icons/Icon';

export default function HabitCard({ habit, date }) {
	const isWeeklyHabit = habit.frequency === 'weekly' && habit.timesPerPeriod;

	// Use completions array for done state
	let completions = [];
	if (isWeeklyHabit) {
		completions = Array.isArray(habit.weeklyCompletions)
			? habit.weeklyCompletions
			: [];
	} else {
		completions = Array.isArray(habit.completedDates)
			? habit.completedDates
			: [];
	}
	const alreadyDone = completions.some((d) => isSameDay(new Date(d), date));

	const iconScale = 1 + Math.floor(habit.streak / 5) * 0.25;

	// Get weekly completions if it's a weekly habit
	const getWeeklyProgress = () => {
		if (!isWeeklyHabit) return null;

		// Get start of week (Monday)
		const today = new Date(date);
		const day = today.getDay();
		const diff = today.getDate() - day + (day === 0 ? -6 : 1);
		const weekStart = new Date(today.setDate(diff));
		weekStart.setHours(0, 0, 0, 0);

		// Get end of week (Sunday)
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekEnd.getDate() + 7);

		// Filter completions for current week
		const weeklyCompletions = (habit.weeklyCompletions || []).filter(
			(completion) => {
				const completionDate = new Date(completion);
				return completionDate >= weekStart && completionDate < weekEnd;
			}
		);

		return {
			completed: weeklyCompletions.length,
			total: habit.timesPerPeriod,
			remaining: habit.timesPerPeriod - weeklyCompletions.length,
			isWeekComplete: weeklyCompletions.length >= habit.timesPerPeriod,
		};
	};

	const weeklyProgress = getWeeklyProgress();

	return (
		<div
			key={habit.id}
			className={`p-3 rounded-md w-full flex items-start gap-3 transition-colors duration-200
				${alreadyDone ? 'bg-green-50' : 'bg-gray-50'}
				${weeklyProgress?.isWeekComplete ? 'opacity-75' : 'opacity-100'}
			`}
		>
			<HabitCheckbox habit={habit} date={date} />

			<div className="flex-1">
				<div className="font-medium capitalize">{habit.name}</div>
				{habit.details && (
					<div className="text-xs text-gray-500">{habit.details}</div>
				)}
				{isWeeklyHabit && (
					<div className="text-xs text-gray-500 mt-1">
						{weeklyProgress.completed}/{weeklyProgress.total} this week
						{weeklyProgress.remaining > 0
							? ` (${weeklyProgress.remaining} more to go)`
							: ' (completed for this week)!'}
					</div>
				)}
			</div>

			<div className="text-xs text-gray-500 flex items-center gap-1">
				<Icon icon="fire" color="#f97316" size="sm" scale={iconScale} />
				{habit.streak}
			</div>
		</div>
	);
}
