import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getUniqueDateIdentifier } from '../utils/dateHelpers';

export function useQueryCleanup(dates) {
	const queryClient = useQueryClient();

	useEffect(() => {
		return () => {
			dates.forEach((date) => {
				queryClient.removeQueries([
					'habitsForDate',
					getUniqueDateIdentifier(date),
				]);
			});
		};
	}, [dates, queryClient]);
}
