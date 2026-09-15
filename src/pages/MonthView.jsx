import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	addMonths,
	formatMonthTitle,
	getMonthGrid,
	getLocalDateKey,
	isSameDay,
} from '../utils/dateHelpers';
import { getAllHabits } from '../services/habitService';
import { habitKeys } from '../queries/habitKeys';
import { getDayStatus } from '../services/dayStatus';
import { useUser } from '../contexts/UserContext';
import DaySheet from '../components/DaySheet';
import { useToday } from '../hooks/useToday';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_STYLES = {
	completed: 'bg-green-100 text-green-900',
	partial: 'bg-amber-50 text-amber-900',
	incomplete: 'bg-gray-100 text-gray-500',
	'today-pending': 'bg-white text-gray-900',
	'no-habits': 'bg-white text-gray-400',
	future: 'bg-white text-gray-400',
};

export default function MonthView() {
	const { user } = useUser();
	const today = useToday();
	const [month, setMonth] = useState(() => addMonths(today, 0));
	const [openDate, setOpenDate] = useState(null);

	// One read for the whole month — the grid derives every cell from it rather
	// than firing a query per day.
	const { data: habits = [] } = useQuery({
		queryKey: habitKeys.byUser(user?.id),
		queryFn: () => getAllHabits(user.id),
		enabled: !!user,
	});

	const days = useMemo(() => getMonthGrid(month), [month]);

	const statuses = useMemo(() => {
		const map = new Map();
		for (const { date } of days) {
			map.set(getLocalDateKey(date), getDayStatus(habits, date, today));
		}
		return map;
	}, [days, habits, today]);

	return (
		<div className="p-4 max-w-screen-sm mx-auto">
			<div className="flex items-center justify-between mb-4">
				<button
					onClick={() => setMonth(m => addMonths(m, -1))}
					className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
					aria-label="Previous month"
				>
					‹
				</button>
				<h1 className="text-lg font-semibold">{formatMonthTitle(month)}</h1>
				<button
					onClick={() => setMonth(m => addMonths(m, 1))}
					className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
					aria-label="Next month"
				>
					›
				</button>
			</div>

			<div className="grid grid-cols-7 gap-1 mb-1">
				{WEEKDAYS.map(day => (
					<div key={day} className="text-center text-xs text-gray-400 py-1">
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1">
				{days.map(({ date, inMonth }) => {
					const status = statuses.get(getLocalDateKey(date));
					const isToday = isSameDay(date, today);
					const isFuture = status === 'future';

					return (
						<button
							key={getLocalDateKey(date)}
							onClick={() => !isFuture && setOpenDate(date)}
							disabled={isFuture}
							aria-label={`${date.getDate()} — ${status.replace('-', ' ')}`}
							className={`aspect-square rounded-md text-sm flex items-center justify-center
								transition-colors ${STATUS_STYLES[status]}
								${inMonth ? '' : 'opacity-30'}
								${isToday ? 'ring-2 ring-gray-800' : 'ring-1 ring-gray-200'}
								${isFuture ? 'cursor-default' : 'cursor-pointer hover:brightness-95'}`}
						>
							{date.getDate()}
						</button>
					);
				})}
			</div>

			<DaySheet date={openDate} onClose={() => setOpenDate(null)} />
		</div>
	);
}
