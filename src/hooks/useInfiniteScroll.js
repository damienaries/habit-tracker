import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { generateDateRange } from '../utils/dateHelpers';

const PAST_DAYS_LIMIT = 5; // Limit scrolling to 5 days in the past
const FUTURE_DAYS_RADIUS = 10; // Keep 10 days in the future
const LOAD_SIZE = 5; // Load 5 new dates at a time

export function useInfiniteScroll(initialDates) {
	const [dates, setDates] = useState(initialDates);
	const isLoadingRef = useRef(false);

	// Function to trim dates outside our window
	const trimDatesToWindow = (allDates, today) => {
		const todayTime = today.getTime();
		const dayInMs = 24 * 60 * 60 * 1000;

		return allDates.filter((date) => {
			const diffInDays = (date.getTime() - todayTime) / dayInMs;
			// Keep dates between -5 days and +10 days from today
			return diffInDays >= -PAST_DAYS_LIMIT && diffInDays <= FUTURE_DAYS_RADIUS;
		});
	};

	// Intersection observers for top and bottom loading triggers
	const [topRef, topInView] = useInView({
		threshold: 0,
		rootMargin: '200px 0px 0px 0px',
	});

	const [bottomRef, bottomInView] = useInView({
		threshold: 0,
		rootMargin: '200px 0px 0px 0px',
	});

	// Load more dates when reaching the top (past)
	useEffect(() => {
		if (topInView && dates.length > 0 && !isLoadingRef.current) {
			const firstDate = dates[0];
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// Check if we've reached the past limit
			const daysSinceToday =
				(today.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000);
			if (daysSinceToday >= PAST_DAYS_LIMIT) {
				return;
			}

			isLoadingRef.current = true;
			const newDates = generateDateRange(firstDate, -LOAD_SIZE, -1);
			setDates((prev) => {
				const combined = [...newDates, ...prev];
				return trimDatesToWindow(combined, today);
			});

			setTimeout(() => {
				isLoadingRef.current = false;
			}, 500);
		}
	}, [topInView, dates]);

	// Load more dates when reaching the bottom (future)
	useEffect(() => {
		if (bottomInView && dates.length > 0 && !isLoadingRef.current) {
			isLoadingRef.current = true;
			const lastDate = dates[dates.length - 1];
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const newDates = generateDateRange(lastDate, 1, LOAD_SIZE);
			setDates((prev) => {
				const combined = [...prev, ...newDates];
				return trimDatesToWindow(combined, today);
			});

			setTimeout(() => {
				isLoadingRef.current = false;
			}, 500);
		}
	}, [bottomInView, dates]);

	return {
		dates,
		topRef,
		bottomRef,
	};
}
