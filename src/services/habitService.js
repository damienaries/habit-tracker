import { db } from '../db/habitDb';

// Create a new habit
export async function createHabit({
	userId,
	name,
	frequency,
	startDate,
	endDate = null,
	customInterval = null,
	timesPerPeriod = null,
	details = '',
	lastDone = null,
}) {
	if (!userId || !name || !frequency || !startDate) {
		throw new Error('User ID, name, frequency, and start date are required');
	}

	return await db.habits.add({
		userId,
		name,
		frequency,
		startDate,
		endDate,
		customInterval,
		timesPerPeriod,
		details,
		streak: 0,
		lastDone,
		isPaused: false,
		completedDates: [],
		weeklyCompletions: [],
	});
}

// Get all habits for a user
export async function getAllHabits(userId) {
	if (!userId) {
		throw new Error('User ID is required');
	}
	return await db.habits.where('userId').equals(userId).toArray();
}

// Get a habit by ID
export async function getHabit(id) {
	if (!id) {
		throw new Error('Habit ID is required');
	}

	const habit = await db.habits.get(id);
	if (!habit) {
		throw new Error(`Habit with ID ${id} not found`);
	}

	return habit;
}

// update a habit
export async function updateHabit(id, updates) {
	if (!id) {
		throw new Error('Habit ID is required');
	}

	const habit = await db.habits.get(id);
	if (!habit) {
		throw new Error(`Habit with ID ${id} not found`);
	}

	return await db.habits.update(id, updates);
}

// Delete a habit
export async function deleteHabit(id) {
	if (!id) {
		throw new Error('Habit ID is required');
	}

	const habit = await db.habits.get(id);
	if (!habit) {
		throw new Error(`Habit with ID ${id} not found`);
	}

	await db.habits.delete(id);
}
