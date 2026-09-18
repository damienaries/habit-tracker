import { describe, it, expect } from 'vitest';
import { getDayProgress, habitsForDay, completionsInWeekOf } from './dayStatus';
import { FREQUENCY } from './schedule';

const MON_JUN_3 = new Date(2024, 5, 3);
const TUE_JUN_4 = new Date(2024, 5, 4);
const WED_JUN_5 = new Date(2024, 5, 5);

const daily = (name, completions = []) => ({
	id: name,
	name,
	frequency: FREQUENCY.DAILY,
	startDate: MON_JUN_3,
	completions,
});

describe('getDayProgress', () => {
	it('counts every habit shown on the day, not only the ones strictly due', () => {
		// The regression: two daily habits done plus an untouched flexible weekly
		// one used to report "completed" while the card showed two of three.
		const habits = [
			daily('a', ['2024-06-03']),
			daily('b', ['2024-06-03']),
			{
				id: 'gym',
				frequency: FREQUENCY.WEEKLY,
				timesPerPeriod: 3,
				startDate: MON_JUN_3,
				completions: [],
			},
		];

		const progress = getDayProgress(habits, MON_JUN_3, WED_JUN_5);
		expect(progress.done).toBe(2);
		expect(progress.total).toBe(3);
		expect(progress.complete).toBe(false);
	});

	it('is complete only when everything on the card is ticked', () => {
		const habits = [daily('a', ['2024-06-03']), daily('b', ['2024-06-03'])];
		const progress = getDayProgress(habits, MON_JUN_3, WED_JUN_5);

		expect(progress.ratio).toBe(1);
		expect(progress.complete).toBe(true);
	});

	it('reports a fraction rather than a bucket', () => {
		const habits = [daily('a', ['2024-06-03']), daily('b', []), daily('c', []), daily('d', [])];
		expect(getDayProgress(habits, MON_JUN_3, WED_JUN_5).ratio).toBe(0.25);
	});

	it('distinguishes one of four from three of four', () => {
		const some = [daily('a', ['2024-06-03']), daily('b', []), daily('c', []), daily('d', [])];
		const most = [
			daily('a', ['2024-06-03']),
			daily('b', ['2024-06-03']),
			daily('c', ['2024-06-03']),
			daily('d', []),
		];

		expect(getDayProgress(some, MON_JUN_3, WED_JUN_5).ratio).toBeLessThan(
			getDayProgress(most, MON_JUN_3, WED_JUN_5).ratio
		);
	});

	it('marks an empty day rather than calling it a zero', () => {
		const habits = [
			{
				id: 'weekend',
				frequency: FREQUENCY.SPECIFIC_DAYS,
				daysOfWeek: [6, 0],
				startDate: MON_JUN_3,
				completions: [],
			},
		];
		expect(getDayProgress(habits, TUE_JUN_4, WED_JUN_5).state).toBe('empty');
	});

	it('labels today and the future so they are never shaded as misses', () => {
		const habits = [daily('a', [])];
		expect(getDayProgress(habits, WED_JUN_5, WED_JUN_5).state).toBe('today');
		expect(getDayProgress(habits, WED_JUN_5, MON_JUN_3).state).toBe('future');
		expect(getDayProgress(habits, MON_JUN_3, WED_JUN_5).state).toBe('past');
	});
});

describe('habitsForDay', () => {
	it('drops a flexible weekly habit once the week target is met', () => {
		const habit = {
			id: 'gym',
			frequency: FREQUENCY.WEEKLY,
			timesPerPeriod: 2,
			startDate: MON_JUN_3,
			completions: ['2024-06-03', '2024-06-04'],
		};
		expect(habitsForDay([habit], WED_JUN_5)).toHaveLength(0);
		// ...but the days it was actually done still show it.
		expect(habitsForDay([habit], TUE_JUN_4)).toHaveLength(1);
	});
});

describe('completionsInWeekOf', () => {
	it('counts only completions inside that Monday-to-Sunday week', () => {
		const habit = {
			completions: ['2024-06-02', '2024-06-03', '2024-06-09', '2024-06-10'],
		};
		// Week of Jun 3 runs Mon 3 to Sun 9.
		expect(completionsInWeekOf(habit, WED_JUN_5)).toBe(2);
	});
});

describe('flexible weekly habits count toward the day', () => {
	const gym = completions => ({
		id: 'gym',
		frequency: FREQUENCY.WEEKLY,
		timesPerPeriod: 3,
		startDate: MON_JUN_3,
		completions,
	});

	it('counts as done on a day it was actually done', () => {
		expect(getDayProgress([gym(['2024-06-03'])], MON_JUN_3, new Date(2024, 5, 20))).toMatchObject({
			done: 1,
			total: 1,
			complete: true,
		});
	});

	it('is simply absent on a day it does not appear', () => {
		// Target met earlier in the week, so it is off Tuesday's card entirely.
		const habit = gym(['2024-06-03', '2024-06-04', '2024-06-05']);
		expect(getDayProgress([habit], new Date(2024, 5, 6), new Date(2024, 5, 20)).state).toBe('empty');
	});
});

describe('todos count toward a day', () => {
	const todo = (id, dueDate, completedOn = null) => ({ id, title: id, dueDate, completedOn });

	it('counts errands alongside habits', async () => {
		const { getDayProgress } = await import('./dayStatus');
		const habits = [daily('read', ['2024-06-03'])];
		const todos = [todo('parcel', '2024-06-03'), todo('call', '2024-06-03', '2024-06-03')];

		// Habit done, one errand done, one not.
		expect(getDayProgress(habits, MON_JUN_3, WED_JUN_5, todos)).toMatchObject({
			done: 2,
			total: 3,
		});
	});

	it('only reads as complete when the errands are done too', async () => {
		const { getDayProgress } = await import('./dayStatus');
		const habits = [daily('read', ['2024-06-03'])];

		expect(
			getDayProgress(habits, MON_JUN_3, WED_JUN_5, [todo('parcel', '2024-06-03')]).complete
		).toBe(false);
		expect(
			getDayProgress(habits, MON_JUN_3, WED_JUN_5, [
				todo('parcel', '2024-06-03', '2024-06-03'),
			]).complete
		).toBe(true);
	});

	it('ignores errands due on other days', async () => {
		const { getDayProgress } = await import('./dayStatus');
		expect(
			getDayProgress([daily('read', [])], MON_JUN_3, WED_JUN_5, [todo('later', '2024-06-09')])
				.total
		).toBe(1);
	});
});

describe('getDayItems', () => {
	const todo = (id, dueDate, completedOn = null) => ({ id, title: id, dueDate, completedOn });

	it('lists errands before habits, one entry per bullet', async () => {
		const { getDayItems } = await import('./dayStatus');
		const items = getDayItems(
			[daily('read', ['2024-06-03'])],
			MON_JUN_3,
			[todo('parcel', '2024-06-03')]
		);

		expect(items.map(i => i.kind)).toEqual(['todo', 'habit']);
		expect(items.map(i => i.done)).toEqual([false, true]);
	});

	it('matches the counts the ratio is built from', async () => {
		const { getDayItems, getDayProgress } = await import('./dayStatus');
		const habits = [daily('a', ['2024-06-03']), daily('b', [])];
		const todos = [todo('parcel', '2024-06-03', '2024-06-03')];

		const items = getDayItems(habits, MON_JUN_3, todos);
		const progress = getDayProgress(habits, MON_JUN_3, WED_JUN_5, todos);

		expect(items).toHaveLength(progress.total);
		expect(items.filter(i => i.done)).toHaveLength(progress.done);
	});
});
