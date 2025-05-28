import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isSameDay } from '../utils/dateHelpers';
import { toggleHabitCompletion } from '../db/habitDb';

function getStartOfWeek(date) {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

export default function HabitCheckbox({ habit, date }) {
	const queryClient = useQueryClient();
	const isToday = isSameDay(date, new Date());

	// Use completions array for done state
	const isWeeklyHabit = habit.frequency === 'weekly' && habit.timesPerPeriod;
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
	const isDone = completions.some((d) => isSameDay(new Date(d), date));

	const mutation = useMutation({
		mutationFn: async () => {
			await toggleHabitCompletion(habit, date);
		},
		onSuccess: () => {
			// Invalidate all habitsForDate queries for the current week
			const weekStart = getStartOfWeek(date);
			for (let i = 0; i < 7; i++) {
				const d = new Date(weekStart);
				d.setDate(weekStart.getDate() + i);
				queryClient.invalidateQueries({
					queryKey: ['habitsForDate', d.toDateString()],
				});
			}
		},
	});

	const handleToggle = () => {
		if (!isToday || mutation.isPending) return;
		mutation.mutate();
	};

	return (
		<div className="relative mt-1">
			<input
				type="checkbox"
				checked={isDone}
				onChange={handleToggle}
				disabled={!isToday || mutation.isPending}
				className={`w-5 h-5 rounded-md p-1	accent-black
					transition-all duration-200 ease-in-out
					${!isToday && 'opacity-50 cursor-not-allowed'}
					${mutation.isPending && 'animate-pulse'}
				`}
				aria-label={isDone ? 'Mark habit as not done' : 'Mark habit as done'}
			/>
		</div>
	);
}
