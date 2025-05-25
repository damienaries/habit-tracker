import { isSameDay } from '../utils/dateHelpers';

export default function DayCardWrapper({ date, today, children, todayRef }) {
	const isToday = isSameDay(date, today);

	return (
		<div
			ref={isToday ? todayRef : null}
			className={`w-full transform transition-all duration-300 ${
				isToday ? 'scale-100 opacity-100' : 'scale-95 opacity-80'
			}`}
		>
			{children}
		</div>
	);
}
