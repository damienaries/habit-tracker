import { useQuery } from '@tanstack/react-query';
import { db } from '../db/habitDb';
import HabitCard from '../components/HabitCard';
import { useUser } from '../contexts/UserContext';
import Icon from '../components/icons/Icon';

export default function AllHabitsView() {
	const { user } = useUser();

	const {
		data: habits,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['allHabits', user?.id],
		queryFn: () => db.habits.where('userId').equals(user.id).toArray(),
		enabled: !!user,
	});

	return (
		<div className="p-6 max-w-screen-sm mx-auto space-y-4">
			<h1 className="text-xl mb-4 flex items-center gap-2">
				<Icon icon="streak-up" size="lg" color="#6B7280" />
				<span>Streak progress for {user?.name}</span>
			</h1>

			{isLoading && <p className="text-gray-500">Loading habits...</p>}
			{error && <p className="text-red-600">Error loading habits.</p>}

			{habits?.length === 0 && !isLoading ? (
				<p className="text-gray-400">No habits created yet.</p>
			) : (
				<ul className="space-y-3">
					{habits?.map(habit => (
						<li key={habit.id}>
							<HabitCard habit={habit} date={new Date()} dayCard={false} />
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
