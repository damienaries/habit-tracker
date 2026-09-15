import { describe, it, expect } from 'vitest';
import {
	getStartOfWeek,
	isSameDay,
	generateDateRange,
	getMonthGrid,
	addMonths,
	getLocalDateKey,
} from './dateHelpers';

describe('getStartOfWeek', () => {
	it('returns the same Monday for every day of that week', () => {
		const monday = new Date(2024, 5, 3);
		const week = [3, 4, 5, 6, 7, 8, 9].map(d => new Date(2024, 5, d));

		for (const day of week) {
			expect(getStartOfWeek(day).getTime()).toBe(monday.getTime());
		}
	});

	it('treats Sunday as the end of the week, not the start', () => {
		const sunday = new Date(2024, 5, 9);
		expect(getStartOfWeek(sunday).getDate()).toBe(3);
		expect(getStartOfWeek(sunday).getDay()).toBe(1);
	});

	it('does not mutate the date it is given', () => {
		const date = new Date(2024, 5, 6);
		getStartOfWeek(date);
		expect(date.getDate()).toBe(6);
	});
});

describe('isSameDay', () => {
	it('ignores the time of day', () => {
		expect(isSameDay(new Date(2024, 5, 3, 1), new Date(2024, 5, 3, 23))).toBe(true);
		expect(isSameDay(new Date(2024, 5, 3), new Date(2024, 5, 4))).toBe(false);
	});
});

describe('generateDateRange', () => {
	it('spans the offsets inclusively around the base date', () => {
		const range = generateDateRange(new Date(2024, 5, 5), -2, 2);
		expect(range).toHaveLength(5);
		expect(range.map(d => d.getDate())).toEqual([3, 4, 5, 6, 7]);
	});
});

describe('getMonthGrid', () => {
	it('starts on a Monday and holds whole weeks', () => {
		const grid = getMonthGrid(new Date(2024, 5, 15));
		expect(grid.length % 7).toBe(0);
		expect(grid[0].date.getDay()).toBe(1);
	});

	it('covers every day of the month exactly once', () => {
		const grid = getMonthGrid(new Date(2024, 5, 15));
		const inMonth = grid.filter(d => d.inMonth).map(d => d.date.getDate());
		expect(inMonth).toHaveLength(30);
		expect(new Set(inMonth).size).toBe(30);
	});

	it('pads with adjacent months rather than leaving gaps', () => {
		const grid = getMonthGrid(new Date(2024, 5, 15));
		// June 2024 starts on a Saturday, so Mon 27 - Fri 31 May lead it in.
		expect(grid[0].inMonth).toBe(false);
		expect(grid[0].date.getMonth()).toBe(4);
	});

	it('does not render a trailing empty week', () => {
		// February 2021 starts on a Monday and has exactly 28 days.
		const grid = getMonthGrid(new Date(2021, 1, 10));
		expect(grid).toHaveLength(28);
		expect(grid.every(d => d.inMonth)).toBe(true);
	});
});

describe('addMonths', () => {
	it('rolls over the year boundary', () => {
		const dec = new Date(2024, 11, 15);
		expect(addMonths(dec, 1).getFullYear()).toBe(2025);
		expect(addMonths(dec, 1).getMonth()).toBe(0);
	});

	it('does not overflow on month lengths', () => {
		// Jan 31 + 1 month must land in February, not March.
		expect(addMonths(new Date(2024, 0, 31), 1).getMonth()).toBe(1);
	});
});

describe('normalizeDate on a date-input string', () => {
	it('keeps the calendar date the user picked', async () => {
		const { normalizeDate } = await import('../db/habitDb');
		// Regression: 'YYYY-MM-DD' parses as UTC midnight, which is the previous
		// day anywhere west of UTC.
		expect(getLocalDateKey(normalizeDate('2024-06-03'))).toBe('2024-06-03');
	});
});
