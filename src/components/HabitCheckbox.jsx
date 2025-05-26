import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isSameDay } from '../utils/dateHelpers';
import { db } from '../db/habitDb';

export default function HabitCheckbox({ habit, date }) {
	const queryClient = useQueryClient();
	const isToday = isSameDay(date, new Date());
	const isDone = Boolean(habit.lastDone && isSameDay(habit.lastDone, date));

	const mutation = useMutation({
		mutationFn: async () => {
			if (isDone) {
				// If already done, uncheck by setting lastDone to null and decreasing streak
				await db.habits.update(habit.id, {
					streak: Math.max(0, habit.streak - 1),
					lastDone: null,
				});
			} else {
				// If not done, check by setting lastDone to current date and increasing streak
				await db.habits.update(habit.id, {
					streak: habit.streak + 1,
					lastDone: new Date(date),
				});
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['habitsForDate', date.toDateString()],
			});
		},
	});

	const handleToggle = () => {
		if (!isToday || mutation.isPending) return;
		mutation.mutate();
	};

	return (
		<div className="relative">
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
