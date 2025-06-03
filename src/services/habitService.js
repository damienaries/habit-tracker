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
		completedDays: 0,
		lastDone,
	});
}

// Get all habits for a user
export async function getAllHabits(userId) {
	if (!userId) {
		throw new Error('User ID is required');
	}
	return await db.habits.where('userId').equals(userId).toArray();
}

// Get habits for a specific date
export async function getHabitsForDate(userId, date) {
	if (!userId) {
		throw new Error('User ID is required');
	}
	const habits = await db.habits.where('userId').equals(userId).toArray();
	return habits.filter(habit => {
		const startDate = new Date(habit.startDate);
		const endDate = habit.endDate ? new Date(habit.endDate) : null;
		const checkDate = new Date(date);

		// Set all dates to midnight for comparison
		startDate.setHours(0, 0, 0, 0);
		checkDate.setHours(0, 0, 0, 0);
		if (endDate) endDate.setHours(0, 0, 0, 0);

		return checkDate >= startDate && (!endDate || checkDate <= endDate);
	});
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
export async function completeHabit(userId, habitId) {
	if (!userId || !habitId) {
		throw new Error('User ID and Habit ID are required');
	}

	const date = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

	// Check if the habit exists and belongs to the user
	const habit = await db.habits
		.where('userId')
		.equals(userId)
		.and(h => h.id === habitId)
		.first();
	if (!habit) {
		throw new Error(`Habit with ID ${habitId} not found for user ${userId}`);
	}

	// Check if already completed today
	const alreadyCompleted = habit.completions?.some(c => c.date === date);
	if (alreadyCompleted) {
		return;
	}

	await db.habits.update(habitId, {
		completedDays: (habit.completedDays || 0) + 1,
		streak: (habit.streak || 0) + 1,
		completions: [...(habit.completions || []), { date, id: crypto.randomUUID() }],
	});
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
