import { db } from '../db/habitDb';

// Create a new habit
export async function createHabit({
	name,
	frequency,
	startDate,
	endDate = null,
	customInterval = null,
	timesPerPeriod = null,
	details = '',
}) {
	if (!name || !frequency || !startDate) {
		throw new Error('Name, frequency, and start date are required');
	}

	return await db.habits.add({
		name,
		frequency,
		startDate,
		endDate,
		customInterval,
		timesPerPeriod,
		details,
		streak: 0,
		completedDays: 0,
	});
}

// Get all habits
export async function getAllHabits() {
	return await db.habits.toArray();
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

// Mark a habit as completed
export async function completeHabit(id) {
	if (!id) {
		throw new Error('Habit ID required');
	}
	const date = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

	// Check if the habit exists
	const alreadyCompleted = await db.completions
		.where({ habitId: id, date })
		.first();

	if (alreadyCompleted) {
		return;
	}

	const habit = await db.habits.get(id);
	if (!habit) {
		throw new Error(`Habit with ID ${id} not found`);
	}

	await db.habits.update(id, {
		completedDays: (habit.completedDays || 0) + 1,
		streak: (habit.streak || 0) + 1,
	});
	await db.completions.add({ habitId: id, date });
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
	await db.completions.where({ habitId: id }).delete();
}
