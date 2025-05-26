import { useRef, useEffect } from 'react';

export function useScrollToToday() {
	const todayRef = useRef(null);

	useEffect(() => {
		if (todayRef.current) {
			todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, []);

	return todayRef;
}
