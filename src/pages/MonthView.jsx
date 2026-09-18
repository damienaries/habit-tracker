import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
	addMonths,
	addWeeks,
	formatMonthTitle,
	formatWeekTitle,
	getMonthGrid,
	getWeekDays,
	getLocalDateKey,
} from '../utils/dateHelpers';
import { getAllHabits } from '../services/habitService';
import { getAllTodos } from '../services/todoService';
import { habitKeys } from '../queries/habitKeys';
import { todoKeys } from '../queries/todoKeys';
import { getDayProgress, getDayItems } from '../services/dayStatus';
import { useUser } from '../contexts/UserContext';
import { useToday } from '../hooks/useToday';
import DaySheet from '../components/DaySheet';
import MonthGrid from '../components/MonthGrid';
import WeekView from '../components/WeekView';

export default function CalendarView() {
	const { user } = useUser();
	const today = useToday();
	const [searchParams, setSearchParams] = useSearchParams();
	const [anchor, setAnchor] = useState(() => new Date(today));
	const [openDate, setOpenDate] = useState(null);

	// The view lives in the URL so the tab bar can flip it without the two
	// components having to share state.
	const view = searchParams.get('view') === 'week' ? 'week' : 'month';

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

	const monthDays = useMemo(() => getMonthGrid(anchor), [anchor]);
	const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);

	const progress = useMemo(() => {
		const map = new Map();
		for (const date of [...monthDays.map(d => d.date), ...weekDays]) {
			const key = getLocalDateKey(date);
			if (!map.has(key)) map.set(key, getDayProgress(habits, date, today, todos));
		}
		return map;
	}, [monthDays, weekDays, habits, todos, today]);

	// Bullets and the ratio come from the same list so they can never disagree.
	const itemsByDate = useMemo(() => {
		const map = new Map();
		for (const date of weekDays) {
			map.set(getLocalDateKey(date), getDayItems(habits, date, todos));
		}
		return map;
	}, [weekDays, habits, todos]);

	const todosByDate = useMemo(() => {
		const map = new Map();
		for (const todo of todos) {
			if (!map.has(todo.dueDate)) map.set(todo.dueDate, []);
			map.get(todo.dueDate).push(todo);
		}
		return map;
	}, [todos]);

	const step = direction =>
		setAnchor(current =>
			view === 'week' ? addWeeks(current, direction) : addMonths(current, direction)
		);

	const setView = next => {
		setSearchParams(next === 'week' ? { view: 'week' } : {}, { replace: true });
		setAnchor(new Date(today));
	};

	return (
		<div className="px-4 py-5">
			<div className="flex items-center justify-between mb-3 gap-2">
				<h1 className="text-display text-[1.6rem] min-w-0 truncate">
					{view === 'week' ? formatWeekTitle(anchor) : formatMonthTitle(anchor)}
				</h1>

				<div className="flex items-center shrink-0">
					<button
						type="button"
						onClick={() => step(-1)}
						aria-label={view === 'week' ? 'Previous week' : 'Previous month'}
						className="w-9 h-9 grid place-items-center rounded-full text-[var(--c-muted)] transition-colors hover:bg-[var(--c-surface-sunk)]"
					>
						<span aria-hidden="true" className="text-xl leading-none">‹</span>
					</button>
					<button
						type="button"
						onClick={() => step(1)}
						aria-label={view === 'week' ? 'Next week' : 'Next month'}
						className="w-9 h-9 -mr-2 grid place-items-center rounded-full text-[var(--c-muted)] transition-colors hover:bg-[var(--c-surface-sunk)]"
					>
						<span aria-hidden="true" className="text-xl leading-none">›</span>
					</button>
				</div>
			</div>

			<div
				role="tablist"
				aria-label="Calendar range"
				className="flex p-1 gap-1 rounded-[var(--radius)] bg-[var(--c-surface-sunk)] mb-4"
			>
				{['week', 'month'].map(option => (
					<button
						key={option}
						type="button"
						role="tab"
						aria-selected={view === option}
						onClick={() => setView(option)}
						className={`flex-1 min-h-[34px] rounded-[var(--radius-sm)] text-sm font-semibold capitalize
							transition-colors duration-[var(--dur-quick)]
							${view === option ? 'bg-[var(--c-surface)] text-[var(--c-text)] shadow-sm' : 'text-[var(--c-muted)]'}`}
					>
						{option}
					</button>
				))}
			</div>

			{view === 'week' ? (
				<WeekView
					days={weekDays}
					progress={progress}
					itemsByDate={itemsByDate}
					todosByDate={todosByDate}
					today={today}
					onOpenDate={setOpenDate}
				/>
			) : (
				<MonthGrid
					days={monthDays}
					progress={progress}
					today={today}
					onOpenDate={setOpenDate}
				/>
			)}

			<DaySheet date={openDate} onClose={() => setOpenDate(null)} />
		</div>
	);
}
