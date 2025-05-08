import { useState, useEffect, useRef } from 'react';
import DayCard from '../components/DayCard';

function generateDateOffset(baseDate, offset) {
	const date = new Date(baseDate);
	date.setDate(date.getDate() + offset);
	date.setHours(0, 0, 0, 0);
	return date;
}

export default function Home() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const [dates, _] = useState(() => [
		generateDateOffset(today, -2),
		generateDateOffset(today, -1),
		generateDateOffset(today, 0), // today
		generateDateOffset(today, 1),
		generateDateOffset(today, 2),
		generateDateOffset(today, 3),
		generateDateOffset(today, 4),
	]);

	const todayRef = useRef(null);

	// Auto-scroll to today on mount
	useEffect(() => {
		if (todayRef.current) {
			todayRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
			});
		}
	}, []);

	return (
		<div
			className="h-[calc(100vh-5rem)] overflow-y-scroll snap-y snap-mandatory px-4 py-6 flex flex-col gap-4 items-center relative"
			style={{
				maskImage:
					'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
				WebkitMaskImage:
					'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
			}}
		>
			{dates.map((date) => {
				const isToday = date.toDateString() === new Date().toDateString();

				return (
					<div
						key={date.toDateString()}
						ref={isToday ? todayRef : null}
						className="w-full"
					>
						<DayCard date={date} />
					</div>
				);
			})}
		</div>
	);
}
