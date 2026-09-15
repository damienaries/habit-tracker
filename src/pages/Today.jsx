import { useMemo, useState } from 'react';
import { formatDateTitle, generateDateOffset } from '../utils/dateHelpers';
import { useToday } from '../hooks/useToday';
import DayHabits from '../components/DayHabits';
import DaySheet from '../components/DaySheet';
import ButtonComponent from '../components/elements/ButtonComponent';

export default function Today() {
	const today = useToday();
	const yesterday = useMemo(() => generateDateOffset(today, -1), [today]);
	const [openDate, setOpenDate] = useState(null);

	return (
		<div className="p-4 max-w-screen-sm mx-auto">
			<h1 className="text-xl font-semibold mb-1">{formatDateTitle(today)}</h1>
			<p className="text-sm text-gray-500 mb-4">Today</p>

			<DayHabits date={today} emptyMessage="Nothing scheduled today." />

			<div className="mt-8 pt-4 border-t border-gray-200">
				<ButtonComponent onClick={() => setOpenDate(yesterday)} variant="secondary" size="sm">
					Forgot something yesterday?
				</ButtonComponent>
			</div>

			<DaySheet date={openDate} onClose={() => setOpenDate(null)} />
		</div>
	);
}
