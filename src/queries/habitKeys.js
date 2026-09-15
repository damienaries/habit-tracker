import { getLocalDateKey } from '../utils/dateHelpers';

// Every habit query key starts with 'habits', so invalidating habitKeys.all
// refreshes every habit view at once. Reads hit IndexedDB locally, so broad
// invalidation is cheap — and it removes any chance of two call sites building
// the same key differently.
export const habitKeys = {
	all: ['habits'],
	byDate: (userId, date) => ['habits', 'byDate', userId ?? null, getLocalDateKey(date)],
	byUser: userId => ['habits', 'byUser', userId ?? null],
};
