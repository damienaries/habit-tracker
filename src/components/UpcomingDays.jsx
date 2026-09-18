import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllHabits } from '../services/habitService';
import { getAllTodos } from '../services/todoService';
import { habitKeys } from '../queries/habitKeys';
import { todoKeys } from '../queries/todoKeys';
import { getUpcoming } from '../services/upcoming';
import { formatRelativeDay } from '../utils/dateHelpers';
import { useUser } from '../contexts/UserContext';

export default function UpcomingDays({ today, onOpenDate }) {
	const { user } = useUser();

	const { data: habits = [] } = useQuery({
		queryKey: habitKeys.byUser(user?.id),
		queryFn: () => getAllHabits(user.id),
		enabled: !!user,
	});

	const { data: todos = [] } = useQuery({
		queryKey: todoKeys.byUser(user?.id),
		queryFn: () => getAllTodos(user.id),
		enabled: !!user,
	});

	const upcoming = useMemo(
		() => getUpcoming(habits, todos, today),
		[habits, todos, today]
	);

	if (upcoming.length === 0) return null;

	return (
		<section className="mt-8">
			<h2 className="text-eyebrow mb-2">Coming up</h2>

			<div className="flex flex-col gap-2">
				{upcoming.map(({ date, dateKey, todos: dayTodos, habits: dayHabits }) => (
					<button
						key={dateKey}
						type="button"
						onClick={() => onOpenDate?.(date)}
						className="w-full text-left rounded-[var(--radius)] border border-[var(--c-border)]
							bg-[var(--c-surface)] p-3 transition-colors duration-[var(--dur-quick)]
							hover:bg-[var(--c-surface-sunk)] active:scale-[0.99]"
					>
						<div className="flex items-baseline justify-between gap-3">
							<span className="text-display-sm text-[0.95rem]">
								{formatRelativeDay(date, today)}
							</span>
							{dayHabits.length > 0 && (
								<span className="text-[0.7rem] text-[var(--c-muted)] numerals shrink-0">
									{dayHabits.length} habit{dayHabits.length === 1 ? '' : 's'}
								</span>
							)}
						</div>

						{/* Todos get named because they are the things you will forget.
						    Habits are a pattern you already know, so they get a count. */}
						{dayTodos.length > 0 && (
							<ul className="mt-1.5 flex flex-col gap-1">
								{dayTodos.map(todo => (
									<li key={todo.id} className="flex items-baseline gap-2 text-sm">
										<span
											aria-hidden="true"
											className="w-1.5 h-1.5 rounded-full bg-[var(--c-accent)] shrink-0 translate-y-[-2px]"
										/>
										<span className="min-w-0 truncate">{todo.title}</span>
									</li>
								))}
							</ul>
						)}
					</button>
				))}
			</div>
		</section>
	);
}
