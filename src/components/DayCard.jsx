import { useQuery } from '@tanstack/react-query';
import { getHabitsForDate } from '../services/habitLogic';

function formatDateTitle(date) {
	return new Intl.DateTimeFormat('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
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
		<article className="bg-white shadow-md rounded-lg p-4 mb-6 w-full max-w-2xl mx-auto">
			<h2 className="text-lg font-semibold mb-2">{formatDateTitle(date)}</h2>

			{isLoading && <p className="text-body-muted">Loading...</p>}
			{error && <p className="text-red-700">Error Loading Habits</p>}

			{habits?.length === 0 && !isLoading ? (
				<p className="text-body-muted mb-6">No habits scheduled today</p>
			) : (
				<ul className="space-y-2">
					{habits?.map((habit) => (
						<li key={habit.id} className="p-4 rounded-md bg-gray-50 shadow-sm">
							<div className="font-medium text-gray-800">{habit.name}</div>
							{habit.details && (
								<div className="text-sm text-gray-500 mt-1">
									{habit.details}
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</article>
	);
}
