import { useEffect, useState } from 'react';
import { getLocalDateKey, getStartOfToday } from '../utils/dateHelpers';

// Today's date, kept current. A PWA is typically left open rather than
// reloaded, so a date captured at mount goes stale over midnight and takes the
// checkboxes with it — HabitCheckbox decides what is editable by comparing
// against the live clock.
export function useToday() {
	const [today, setToday] = useState(getStartOfToday);

	useEffect(() => {
		const check = () => {
			const current = getStartOfToday();
			setToday(prev => (getLocalDateKey(prev) === getLocalDateKey(current) ? prev : current));
		};

		const timer = setInterval(check, 60 * 1000);
		document.addEventListener('visibilitychange', check);

		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', check);
		};
	}, []);

	return today;
}
