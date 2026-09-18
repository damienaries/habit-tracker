import { getLocalDateKey } from '../utils/dateHelpers';

// Mirrors habitKeys: everything under one prefix so a single invalidation
// refreshes every todo view.
export const todoKeys = {
	all: ['todos'],
	byDate: (userId, date) => ['todos', 'byDate', userId ?? null, getLocalDateKey(date)],
	byUser: userId => ['todos', 'byUser', userId ?? null],
};
