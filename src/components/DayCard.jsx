import { isSameDay, formatDateTitle } from '../utils/dateHelpers';
import HabitCard from './HabitCard';
import { useQuery } from '@tanstack/react-query';
import { getHabitsForDate } from '../services/habitLogic';
import { useState, useRef } from 'react';

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

	// Show/hide habits for past days
	const [showHabits, setShowHabits] = useState(false);
	const timerRef = useRef(null);
	const handleToggleHabits = () => {
		if (!isPast || !habits || habits.length === 0) return;
		setShowHabits((prev) => {
			const next = !prev;
			if (next) {
				if (timerRef.current) clearTimeout(timerRef.current);
				timerRef.current = setTimeout(() => setShowHabits(false), 5000);
			}
			return next;
		});
	};

	// Calculate completion status for past days only if there were habits
	const getCompletionStatus = () => {
		if (!habits || habits.length === 0) return 'no-habits';

		// For past days, check if habits were completed on that specific date
		const allCompleted = habits.every((habit) => {
			const completions =
				habit.frequency === 'weekly' && habit.timesPerPeriod
					? habit.weeklyCompletions || []
					: habit.completedDates || [];
			return completions.some((d) => isSameDay(new Date(d), date));
		});

		const someCompleted = habits.some((habit) => {
			const completions =
				habit.frequency === 'weekly' && habit.timesPerPeriod
					? habit.weeklyCompletions || []
					: habit.completedDates || [];
			return completions.some((d) => isSameDay(new Date(d), date));
		});

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
		future: 'bg-white/50',
	};

	const shouldShowHabits = !isPast || showHabits;

	return (
		<article
			className={`snap-center transition-all w-full rounded-xl p-4 shadow-lg ${
				statusStyles[status]
			} ${
				isToday ? 'ring-2 ring-gray-800 ring-offset-4' : 'ring-1 ring-gray-300'
			}`}
			onClick={isPast ? handleToggleHabits : undefined}
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

			{isLoading && <p className="text-sm text-gray-400 mt-3">Loading...</p>}
			{error && (
				<p className="text-sm text-red-600 mt-3">Error loading habits.</p>
			)}

			{/* Show HabitCards if allowed */}
			{shouldShowHabits && habits?.length > 0 && (
				<div className="space-y-2 mt-3">
					{habits.map((habit) => (
						<HabitCard key={habit.id} habit={habit} date={date} />
					))}
				</div>
			)}

			{shouldShowHabits && habits?.length === 0 && !isLoading && (
				<p className="text-sm text-gray-400 mt-3">Nothing scheduled.</p>
			)}
		</article>
	);
}
