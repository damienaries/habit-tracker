import { isSameDay } from '../utils/dateHelpers';

export default function DayCardWrapper({ date, today, children, todayRef }) {
	const isToday = isSameDay(date, today);

	// Simple z-index for stacking
	const zIndex = isToday ? 50 : 40;

	return (
		<div
			ref={isToday ? todayRef : null}
			className="w-full transform transition-all duration-300 mb-4"
			style={{ zIndex }}
		>
			{children}
		</div>
	);
}
