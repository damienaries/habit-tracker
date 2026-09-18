import { useMemo, useState } from 'react';
import { formatDateTitle, generateDateOffset } from '../utils/dateHelpers';
import { useToday } from '../hooks/useToday';
import DayHabits from '../components/DayHabits';
import TodoList from '../components/TodoList';
import UpcomingDays from '../components/UpcomingDays';
import DaySheet from '../components/DaySheet';

export default function Today() {
	const today = useToday();
	const yesterday = useMemo(() => generateDateOffset(today, -1), [today]);
	const [openDate, setOpenDate] = useState(null);

	return (
		<div className="px-4 py-5">
			<h1 className="text-display text-[1.9rem] mb-5">{formatDateTitle(today)}</h1>

			{/* One-off items first: they are the things you will forget. */}
			<TodoList date={today} />

			<DayHabits date={today} emptyMessage="Nothing scheduled today." />

			<UpcomingDays today={today} onOpenDate={setOpenDate} />

			<div className="mt-8 flex justify-center">
				<button
					type="button"
					onClick={() => setOpenDate(yesterday)}
					className="text-sm text-[var(--c-muted)] underline underline-offset-4 decoration-[var(--c-border-strong)] py-2 px-3"
				>
					Forgot something yesterday?
				</button>
			</div>

			<DaySheet date={openDate} onClose={() => setOpenDate(null)} />
		</div>
	);
}
