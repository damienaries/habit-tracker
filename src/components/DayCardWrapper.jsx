import { isSameDay } from '../utils/dateHelpers';

function isMonday(date) {
	return new Date(date).getDay() === 1;
}

export default function DayCardWrapper({ date, today, children, todayRef }) {
	const isToday = isSameDay(date, today);

	const mondaySeparator = isMonday(date)
		? 'pt-4 mt-4 border-t border-gray-300'
		: '';

	return (
		<div
			ref={isToday ? todayRef : null}
			className={`w-full transform transition-all duration-300 mb-4 ${mondaySeparator}`}
		>
			{children}
		</div>
	);
}
