import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isSameDay } from '../utils/dateHelpers';
import { db } from '../db/habitDb';
import ButtonComponent from './elements/ButtonComponent';

export default function HabitCard({ habit, date }) {
	const queryClient = useQueryClient();
	const isToday = isSameDay(date, new Date());
	const alreadyDone = habit.lastDone && isSameDay(habit.lastDone, date);

	const mutation = useMutation({
		mutationFn: async () => {
			await db.habits.update(habit.id, {
				streak: habit.streak + 1,
				lastDone: new Date(date),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['habitsForDate', date.toDateString()],
			});
		},
	});

	const markAsDone = () => {
		if (!isToday || alreadyDone) return;
		mutation.mutate();
	};

	const bgClass = alreadyDone ? 'bg-green-50' : 'bg-gray-100';
	const fireSize = 1 + Math.floor(habit.streak / 5) * 0.25;
	const fireStyle = {
		fontSize: `${fireSize}rem`,
		transition: 'font-size 0.3s ease-in-out',
	};

	return (
		<div className={`p-3 rounded-md w-full space-y-2 ${bgClass}`}>
			<div class="flex justify-between items-center">
				<div className="font-medium">{habit.name}</div>
				<div className="text-xs text-gray-500 flex items-center gap-1">
					<span style={fireStyle}>🔥</span>
					{habit.streak}
				</div>
			</div>

			{habit.details && (
				<div className="text-xs text-gray-500">{habit.details}</div>
			)}

			<ButtonComponent
				onClick={markAsDone}
				disabled={!isToday || alreadyDone || mutation.isPending}
				loading={mutation.isPending}
				variant={alreadyDone ? 'secondary' : 'primary'}
				size="sm"
			>
				{alreadyDone ? '✅' : 'Mark as done'}
			</ButtonComponent>
		</div>
	);
}
