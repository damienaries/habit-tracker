import { isSameDay } from '../utils/dateHelpers';
import { useToggleHabitCompletion } from '../hooks/useHabitMutations';

export default function HabitCheckbox({ habit, date, editing = false }) {
	const isToday = isSameDay(date, new Date());
	const isPaused = habit.isPaused === true;

	// Use completions array for done state
	const isWeeklyHabit = habit.frequency === 'weekly' && habit.timesPerPeriod;
	let completions = [];
	if (isWeeklyHabit) {
		completions = Array.isArray(habit.weeklyCompletions) ? habit.weeklyCompletions : [];
	} else {
		completions = Array.isArray(habit.completedDates) ? habit.completedDates : [];
	}
	const isDone = completions.some(d => isSameDay(new Date(d), date));

	const mutation = useToggleHabitCompletion();

	const handleToggle = e => {
		// Prevent event from bubbling up to parent components
		e.stopPropagation();

		// Allow toggling if it's today OR if we're in edit mode for past days (but not if paused)
		if ((!isToday && !editing) || mutation.isPending || isPaused) return;
		mutation.mutate({ habit, date });
	};

	return (
		<div className="relative mt-1">
			<input
				type="checkbox"
				checked={isDone}
				onChange={handleToggle}
				disabled={(!isToday && !editing) || mutation.isPending || isPaused}
				className={`w-5 h-5 rounded-md p-1	accent-black
					transition-all duration-200 ease-in-out
					${!isToday && !editing && 'opacity-50 cursor-not-allowed'}
					${isPaused && 'opacity-30 cursor-not-allowed'}
					${mutation.isPending && 'animate-pulse'}
				`}
				aria-label={isDone ? 'Mark habit as not done' : 'Mark habit as done'}
			/>
		</div>
	);
}
