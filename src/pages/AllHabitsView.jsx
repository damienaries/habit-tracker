import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllHabits } from '../services/habitService';
import { habitKeys } from '../queries/habitKeys';
import HabitCard from '../components/HabitCard';
import { useUser } from '../contexts/UserContext';
import Icon from '../components/icons/Icon';

function HabitSection({ title, hint, habits }) {
	if (habits.length === 0) return null;

	return (
		<section className="space-y-3">
			<div>
				<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
				{hint && <p className="text-xs text-gray-400">{hint}</p>}
			</div>
			<ul className="space-y-3">
				{habits.map(habit => (
					<li key={habit.id}>
						<HabitCard habit={habit} date={new Date()} dayCard={false} />
					</li>
				))}
			</ul>
		</section>
	);
}

export default function AllHabitsView() {
	const { user } = useUser();

	const {
		data: habits,
		isLoading,
		error,
	} = useQuery({
		queryKey: habitKeys.byUser(user?.id),
		queryFn: () => getAllHabits(user.id),
		enabled: !!user,
	});

	// Past habits keep their streaks and are worth looking back at, but they
	// should not crowd the ones actually in play.
	const { active, past } = useMemo(() => {
		const all = habits || [];
		return {
			active: all.filter(h => !h.endDate),
			past: all
				.filter(h => h.endDate)
				.sort((a, b) => new Date(b.endDate) - new Date(a.endDate)),
		};
	}, [habits]);

	return (
		<div className="p-6 max-w-screen-sm mx-auto space-y-8">
			<h1 className="text-xl flex items-center gap-2">
				<Icon icon="streak-up" size="lg" color="#6B7280" />
				<span>Streak progress for {user?.name}</span>
			</h1>

			{isLoading && <p className="text-gray-500">Loading habits...</p>}
			{error && <p className="text-red-600">Error loading habits.</p>}

			{!isLoading && habits?.length === 0 && (
				<p className="text-gray-400">No habits created yet.</p>
			)}

			<HabitSection title="Active" habits={active} />
			<HabitSection
				title="Past"
				hint="Finished or quit — their records are kept"
				habits={past}
			/>

			{!isLoading && habits?.length > 0 && active.length === 0 && (
				<p className="text-gray-400">
					Nothing active right now. Create a habit to start a new streak.
				</p>
			)}
		</div>
	);
}
