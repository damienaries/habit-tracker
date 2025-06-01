import { useQuery } from '@tanstack/react-query';
import { db } from '../db/habitDb';
import HabitCard from '../components/HabitCard';

export default function AllHabitsView() {
	const {
		data: habits,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['allHabits'],
		queryFn: () => db.habits.toArray(),
	});

	return (
		<div className="p-6 max-w-screen-sm mx-auto space-y-4">
			<h1 className="text-xl font-bold mb-4">📈 Streak Tracker</h1>

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
