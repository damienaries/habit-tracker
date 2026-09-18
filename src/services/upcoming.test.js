import { describe, it, expect } from 'vitest';
import { getUpcoming } from './upcoming';
import { FREQUENCY } from './schedule';

// Monday 3 June 2024.
const MON = new Date(2024, 5, 3);

const daily = id => ({
	id,
	name: id,
	frequency: FREQUENCY.DAILY,
	startDate: new Date(2024, 0, 1),
	completions: [],
});

const onDays = (id, days) => ({
	id,
	name: id,
	frequency: FREQUENCY.SPECIFIC_DAYS,
	daysOfWeek: days,
	startDate: new Date(2024, 0, 1),
	completions: [],
});

const todo = (id, dueDate, completedOn = null) => ({ id, title: id, dueDate, completedOn });

describe('getUpcoming', () => {
	it('starts tomorrow — today has the rest of the screen', () => {
		const days = getUpcoming([daily('read')], [], MON);
		expect(days[0].dateKey).toBe('2024-06-04');
	});

	it('drops days with nothing on them', () => {
		// Saturday only, so the week ahead has exactly one entry.
		const days = getUpcoming([onDays('write', [6])], [], MON);
		expect(days).toHaveLength(1);
		expect(days[0].dateKey).toBe('2024-06-08');
	});

	it('surfaces todos due on a day that has no habits', () => {
		const days = getUpcoming([], [todo('parcel', '2024-06-06')], MON);
		expect(days).toHaveLength(1);
		expect(days[0].todos.map(t => t.title)).toEqual(['parcel']);
	});

	it('leaves out todos that are already done', () => {
		const days = getUpcoming([], [todo('parcel', '2024-06-06', '2024-06-03')], MON);
		expect(days).toHaveLength(0);
	});

	it('ignores anything past the window', () => {
		const days = getUpcoming([], [todo('later', '2024-07-01')], MON);
		expect(days).toHaveLength(0);
	});

	it('keeps habits and todos for the same day together', () => {
		const days = getUpcoming([daily('read')], [todo('parcel', '2024-06-05')], MON);
		const wednesday = days.find(d => d.dateKey === '2024-06-05');

		expect(wednesday.habits).toHaveLength(1);
		expect(wednesday.todos).toHaveLength(1);
	});

	it('does not reach past the end of a finished habit', () => {
		const ending = { ...daily('read'), endDate: new Date(2024, 5, 4) };
		const days = getUpcoming([ending], [], MON);

		expect(days).toHaveLength(1);
		expect(days[0].dateKey).toBe('2024-06-04');
	});
});
