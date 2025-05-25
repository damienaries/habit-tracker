import { isSameDay, formatDateTitle } from '../utils/dateHelpers';
import HabitCard from './HabitCard';
import { useQuery } from '@tanstack/react-query';
import { getHabitsForDate } from '../services/habitLogic';
export default function DayCard({ date }) {
	const isToday = isSameDay(date, new Date());

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

	return (
		<section
			className={`snap-center transition-all w-full max-w-xl rounded-xl p-4 ${
				isToday
					? 'z-30 bg-white shadow-xl scale-100'
					: 'z-10 bg-gray-100 shadow-md scale-95 opacity-80'
			}`}
		>
			<h2 className="text-lg font-semibold mb-3 text-gray-800">
				{formatDateTitle(date)}
			</h2>

			{isLoading && <p className="text-sm text-gray-400">Loading...</p>}
			{error && <p className="text-sm text-red-600">Error loading habits.</p>}

			{habits?.length === 0 && !isLoading ? (
				<p className="text-sm text-gray-400">Nothing scheduled.</p>
			) : (
				<div className="space-y-2">
					{habits?.map((habit) => (
						<HabitCard key={habit.id} habit={habit} date={date} />
					))}
				</div>
			)}
		</section>
	);
}
