import { isSameDay, formatDateTitle } from '../utils/dateHelpers';
import HabitCard from './HabitCard';
import { useQuery } from '@tanstack/react-query';
import { getHabitsForDate } from '../services/habitLogic';

export default function DayCard({ date }) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const isToday = isSameDay(date, today);
	const isPast = date < today;

	const {
		data: habits,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['habitsForDate', date.toDateString()],
		queryFn: () => getHabitsForDate(date),
		staleTime: 1000 * 60 * 5,
		cacheTime: 1000 * 60 * 60,
	});

	// Calculate completion status for past days only if there were habits
	const getCompletionStatus = () => {
		if (!habits || habits.length === 0) return 'no-habits';

		const allCompleted = habits.every(
			(habit) => habit.lastDone && isSameDay(habit.lastDone, date)
		);
		const someCompleted = habits.some(
			(habit) => habit.lastDone && isSameDay(habit.lastDone, date)
		);

		if (allCompleted) return 'completed';
		if (someCompleted) return 'partial';
		return 'incomplete';
	};

	const status = isPast ? getCompletionStatus() : 'future';

	const statusStyles = {
		completed: 'bg-green-100 border-l-4 border-green-500',
		partial: 'bg-yellow-50 border-l-4 border-yellow-500',
		incomplete: 'bg-red-50 border-l-4 border-red-500',
		'no-habits': 'bg-gray-100 border-l-4 border-gray-300 opacity-50',
		future: 'bg-white',
	};

	return (
		<section
			className={`snap-center transition-all w-full rounded-xl p-4 shadow-lg ${
				statusStyles[status]
			} ${
				isToday ? 'ring-2 ring-gray-800 ring-offset-4' : 'ring-1 ring-gray-300'
			}`}
		>
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-semibold text-gray-800">
					{formatDateTitle(date)}
				</h2>
				{isPast && habits && habits.length > 0 && (
					<div className="text-sm">
						{status === 'completed' && '✅'}
						{status === 'partial' && '🟡'}
						{status === 'incomplete' && '❌'}
					</div>
				)}
			</div>

			{!isPast && (
				<>
					{isLoading && (
						<p className="text-sm text-gray-400 mt-3">Loading...</p>
					)}
					{error && (
						<p className="text-sm text-red-600 mt-3">Error loading habits.</p>
					)}

					{habits?.length === 0 && !isLoading ? (
						<p className="text-sm text-gray-400 mt-3">Nothing scheduled.</p>
					) : (
						<div className="space-y-2 mt-3">
							{habits?.map((habit) => (
								<HabitCard key={habit.id} habit={habit} date={date} />
							))}
						</div>
					)}
				</>
			)}
		</section>
	);
}
