import { describe, it, expect } from 'vitest';
import { habitKeys } from './habitKeys';
import { getLocalDateKey } from '../utils/dateHelpers';

describe('getLocalDateKey', () => {
	it('names the date as the calendar shows it, whatever the UTC offset', () => {
		// Local midnight on June 3. In any timezone east of UTC this instant is
		// still June 2 in UTC, which is what getUniqueDateIdentifier reports.
		const localMidnight = new Date(2024, 5, 3, 0, 0, 0);
		expect(getLocalDateKey(localMidnight)).toBe('2024-06-03');
	});

	it('gives late-evening and early-morning of the same day one key', () => {
		expect(getLocalDateKey(new Date(2024, 5, 3, 23, 59))).toBe(
			getLocalDateKey(new Date(2024, 5, 3, 0, 1))
		);
	});

	it('pads single-digit months and days', () => {
		expect(getLocalDateKey(new Date(2024, 0, 5))).toBe('2024-01-05');
	});
});

describe('habitKeys', () => {
	it('prefixes every key with habitKeys.all so one invalidation covers them all', () => {
		const date = new Date(2024, 5, 3);
		expect(habitKeys.byDate(1, date).slice(0, 1)).toEqual(habitKeys.all);
		expect(habitKeys.byUser(1).slice(0, 1)).toEqual(habitKeys.all);
	});

	it('builds the same key for the same day regardless of time of day', () => {
		expect(habitKeys.byDate(1, new Date(2024, 5, 3, 9, 30))).toEqual(
			habitKeys.byDate(1, new Date(2024, 5, 3, 21, 45))
		);
	});

	it('separates users and dates', () => {
		const date = new Date(2024, 5, 3);
		expect(habitKeys.byDate(1, date)).not.toEqual(habitKeys.byDate(2, date));
		expect(habitKeys.byDate(1, date)).not.toEqual(habitKeys.byDate(1, new Date(2024, 5, 4)));
	});

	it('is stable when the user is not loaded yet', () => {
		expect(habitKeys.byUser(undefined)).toEqual(habitKeys.byUser(null));
	});
});
