import { useState, useRef, useEffect, useMemo } from 'react';
import DayCard from '../components/DayCard';
import DayCardWrapper from '../components/DayCardWrapper';
import { useInView } from 'react-intersection-observer';
import { useQueryClient } from '@tanstack/react-query';
import { getUniqueDateIdentifier } from '../utils/dateHelpers';

function generateDateOffset(baseDate, offset) {
	const date = new Date(baseDate);
	date.setDate(date.getDate() + offset);
	date.setHours(0, 0, 0, 0);
	return date;
}

function generateDateRange(baseDate, start, end) {
	const dates = [];
	for (let i = start; i <= end; i++) {
		dates.push(generateDateOffset(baseDate, i));
	}
	return dates;
}

export default function Home() {
	const queryClient = useQueryClient();
	const today = useMemo(() => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		return date;
	}, []);

	// Initialize with 7 days (-2 to +4)
	const [dates, setDates] = useState(() => generateDateRange(today, -2, 4));

	// Refs for scroll container and today's card
	const scrollContainerRef = useRef(null);
	const todayRef = useRef(null);

	// Intersection observers for top and bottom loading triggers
	const [topRef, topInView] = useInView({
		threshold: 0,
		rootMargin: '200px 0px 0px 0px', // Trigger loading when near the top
	});

	const [bottomRef, bottomInView] = useInView({
		threshold: 0,
		rootMargin: '200px 0px 0px 0px', // Trigger loading when near the bottom
	});

	// Load more dates when reaching the top
	useEffect(() => {
		if (topInView) {
			const firstDate = dates[0];
			const newDates = generateDateRange(firstDate, -5, -1);
			setDates((prev) => [...newDates, ...prev]);
		}
	}, [topInView]);

	// Load more dates when reaching the bottom
	useEffect(() => {
		if (bottomInView) {
			const lastDate = dates[dates.length - 1];
			const newDates = generateDateRange(lastDate, 1, 5);
			setDates((prev) => [...prev, ...newDates]);
		}
	}, [bottomInView]);

	// Scroll to today's card on mount
	useEffect(() => {
		if (todayRef.current) {
			todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, []);

	// Cleanup function to remove out-of-view cards
	useEffect(() => {
		return () => {
			dates.forEach((date) => {
				queryClient.removeQueries([
					'habitsForDate',
					date.toISOString().split('T')[0],
				]);
			});
		};
	}, [dates, queryClient]);

	return (
		<div className="relative">
			<div
				ref={scrollContainerRef}
				className="h-[calc(100vh-5rem)] overflow-y-scroll snap-y snap-mandatory px-4 py-6 flex flex-col gap-4 items-center relative scroll-smooth"
			>
				{/* Top loading trigger */}
				<div ref={topRef} className="h-4 w-full" />

				{/* Render day cards */}
				{dates.map((date) => (
					<DayCardWrapper
						key={getUniqueDateIdentifier(date)}
						date={date}
						today={today}
						todayRef={todayRef}
					>
						<DayCard date={date} />
					</DayCardWrapper>
				))}

				{/* Bottom loading trigger */}
				<div ref={bottomRef} className="h-4 w-full" />
			</div>
		</div>
	);
}
