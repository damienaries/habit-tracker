import { useQuery } from '@tanstack/react-query';
import { getHabitsForDate } from '../services/habitLogic';
import HabitCard from './HabitCard';

function formatDateTitle(date) {
	return new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	}).format(date);
}

export default function DayCard({ date }) {
	const {
		data: habits,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['habitsForDate', date.toDateString()],
		queryFn: () => getHabitsForDate(date),
		staleTime: 1000 * 60 * 5, // 5 minutes
		cacheTime: 1000 * 60 * 60, // 60 minutes
	});

	return (
		<article className="bg-white border border-gray-100 shadow-md rounded-lg p-4 mb-6 w-full max-w-2xl mx-auto">
			<h2 className="text-lg font-semibold mb-2">{formatDateTitle(date)}</h2>

			{isLoading && <p className="text-body-muted">Loading...</p>}
			{error && <p className="text-red-700">Error Loading Habits</p>}

			{habits?.length === 0 && !isLoading ? (
				<p className="text-body-muted mb-6">No habits scheduled today</p>
			) : (
				<ul className="space-y-2">
					{habits?.map((habit) => (
						<HabitCard key={habit.id} habit={habit} date={date} />
					))}
				</ul>
			)}
		</article>
	);
}
