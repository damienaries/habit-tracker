import { useMemo } from 'react';
import DayCard from '../components/DayCard';
import DayCardWrapper from '../components/DayCardWrapper';
import InfiniteScrollContainer from '../components/InfiniteScrollContainer';
import {
	generateDateRange,
	getStartOfToday,
	getUniqueDateIdentifier,
} from '../utils/dateHelpers';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useQueryCleanup } from '../hooks/useQueryCleanup';
import { useScrollToToday } from '../hooks/useScrollToToday';

export default function Home() {
	const today = useMemo(() => getStartOfToday(), []);
	const initialDates = useMemo(() => generateDateRange(today, -2, 4), [today]);

	const { dates, topRef, bottomRef } = useInfiniteScroll(initialDates);
	const todayRef = useScrollToToday();
	useQueryCleanup(dates);

	return (
		<InfiniteScrollContainer topRef={topRef} bottomRef={bottomRef}>
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
		</InfiniteScrollContainer>
	);
}
