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

	if (isLoading) return <div className="space-y-2" aria-busy="true">{[0, 1, 2].map(i => (<div key={i} className="h-[72px] rounded-[var(--radius)] bg-[var(--c-surface-sunk)] animate-pulse" />))}</div>;
	if (error) return <p className="text-sm text-[var(--c-danger)]">Could not load your habits. Pull down to try again.</p>;
	if (!habits?.length) {
		return (
			<div className="text-center py-10 px-6">
				<p className="text-display-sm text-[1.05rem] text-[var(--c-text-soft)]">{emptyMessage}</p>
				<p className="text-sm text-[var(--c-muted)] mt-1">Nothing to tick off — enjoy it.</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{habits.map(habit => (
				<HabitCard key={habit.id} habit={habit} date={date} editing={editable} />
			))}
		</div>
	);
}
