import { useQuery } from '@tanstack/react-query';
import { getHabitsForDate } from '../services/habitLogic';
import { habitKeys } from '../queries/habitKeys';
import { useUser } from '../contexts/UserContext';
import HabitCard from './HabitCard';

// The habits for one day. Used by both the today view and the day sheet, so a
// past day is corrected through exactly the same controls as today's.
export default function DayHabits({ date, editable = false, emptyMessage = 'Nothing scheduled.' }) {
	const { user } = useUser();

	const {
		data: habits,
		isLoading,
		error,
	} = useQuery({
		queryKey: habitKeys.byDate(user?.id, date),
		queryFn: () => getHabitsForDate(date, user.id),
		enabled: !!user,
	});

	if (isLoading) return <p className="text-sm text-gray-400">Loading...</p>;
	if (error) return <p className="text-sm text-red-600">Error loading habits.</p>;
	if (!habits?.length) return <p className="text-sm text-gray-400">{emptyMessage}</p>;

	return (
		<div className="space-y-2">
			{habits.map(habit => (
				<HabitCard key={habit.id} habit={habit} date={date} editing={editable} />
			))}
		</div>
	);
}
