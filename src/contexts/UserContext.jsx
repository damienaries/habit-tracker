import { createContext, useContext, useState, useEffect } from 'react';
import { normalizeDate } from '../db/habitDb';
import { db } from '../db/habitDb';

const UserContext = createContext();

export function UserProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// Check for existing user session on mount
	useEffect(() => {
		const storedUserId = localStorage.getItem('currentUserId');
		if (storedUserId) {
			loadUser(storedUserId);
		} else {
			setLoading(false);
		}
	}, []);

	const loadUser = async userId => {
		try {
			const userData = await db.users.get(parseInt(userId));
			if (userData) {
				// Load user's habits
				const habits = await db.habits.where('userId').equals(parseInt(userId)).toArray();
				// Normalize dates in habits
				const normalizedHabits = habits.map(habit => ({
					...habit,
					startDate: normalizeDate(habit.startDate),
					endDate: habit.endDate ? normalizeDate(habit.endDate) : null,
					lastDone: habit.lastDone ? normalizeDate(habit.lastDone) : null,
					completedDates: (habit.completedDates || []).map(d => normalizeDate(d)),
					weeklyCompletions: (habit.weeklyCompletions || []).map(d => normalizeDate(d)),
				}));
				setUser({ ...userData, habits: normalizedHabits });
			}
		} catch (error) {
			console.error('Error loading user:', error);
		}
		setLoading(false);
	};

	const login = async userData => {
		try {
			// Check if user already exists
			const existingUser = await db.users.where('name').equals(userData.name).first();
			let userId;

			if (existingUser) {
				userId = existingUser.id;
			} else {
				// Create new user
				userId = await db.users.add({
					name: userData.name,
					createdAt: userData.createdAt,
					settings: userData.settings,
				});
			}

			// Store current user ID in localStorage
			localStorage.setItem('currentUserId', userId.toString());

			// Load user data
			await loadUser(userId);
		} catch (error) {
			console.error('Error during login:', error);
		}
	};

	const logout = () => {
		localStorage.removeItem('currentUserId');
		setUser(null);
	};

	const updateUserSettings = async settings => {
		if (!user) return;

		try {
			await db.users.update(user.id, {
				settings: {
					...user.settings,
					...settings,
				},
			});
			setUser(prev => ({
				...prev,
				settings: {
					...prev.settings,
					...settings,
				},
			}));
		} catch (error) {
			console.error('Error updating user settings:', error);
		}
	};

	// Habit management methods
	const addHabit = async habit => {
		if (!user) return;

		try {
			const habitId = await db.habits.add({
				...habit,
				userId: user.id,
				createdAt: normalizeDate(new Date()),
				startDate: normalizeDate(habit.startDate),
				endDate: habit.endDate ? normalizeDate(habit.endDate) : null,
				lastDone: habit.lastDone ? normalizeDate(habit.lastDone) : null,
				completedDates: (habit.completedDates || []).map(d => normalizeDate(d)),
				weeklyCompletions: (habit.weeklyCompletions || []).map(d => normalizeDate(d)),
			});

			const newHabit = await db.habits.get(habitId);
			setUser(prev => ({
				...prev,
				habits: [...prev.habits, newHabit],
			}));
		} catch (error) {
			console.error('Error adding habit:', error);
		}
	};

	const updateHabit = async (habitId, updates) => {
		if (!user) return;

		try {
			const normalizedUpdates = {
				...updates,
				startDate: updates.startDate ? normalizeDate(updates.startDate) : undefined,
				endDate: updates.endDate ? normalizeDate(updates.endDate) : undefined,
				lastDone: updates.lastDone ? normalizeDate(updates.lastDone) : undefined,
				completedDates: updates.completedDates
					? updates.completedDates.map(d => normalizeDate(d))
					: undefined,
				weeklyCompletions: updates.weeklyCompletions
					? updates.weeklyCompletions.map(d => normalizeDate(d))
					: undefined,
			};

			await db.habits.update(habitId, normalizedUpdates);
			const updatedHabit = await db.habits.get(habitId);

			setUser(prev => ({
				...prev,
				habits: prev.habits.map(habit => (habit.id === habitId ? updatedHabit : habit)),
			}));
		} catch (error) {
			console.error('Error updating habit:', error);
		}
	};

	const deleteHabit = async habitId => {
		if (!user) return;

		try {
			await db.habits.delete(habitId);
			setUser(prev => ({
				...prev,
				habits: prev.habits.filter(habit => habit.id !== habitId),
			}));
		} catch (error) {
			console.error('Error deleting habit:', error);
		}
	};

	const completeHabit = async (habitId, date = new Date()) => {
		if (!user) return;

		try {
			const normalizedDate = normalizeDate(date);
			const habit = await db.habits.get(habitId);

			if (!habit) return;

			const completions = habit.completions || [];
			// Don't add duplicate completions for the same day
			if (!completions.some(c => normalizeDate(c.date).getTime() === normalizedDate.getTime())) {
				const newCompletions = [...completions, { date: normalizedDate, id: crypto.randomUUID() }];
				await db.habits.update(habitId, { completions: newCompletions });

				const updatedHabit = await db.habits.get(habitId);
				setUser(prev => ({
					...prev,
					habits: prev.habits.map(h => (h.id === habitId ? updatedHabit : h)),
				}));
			}
		} catch (error) {
			console.error('Error completing habit:', error);
		}
	};

	if (loading) {
		return null; // or a loading spinner
	}

	return (
		<UserContext.Provider
			value={{
				user,
				loading,
				login,
				logout,
				updateUserSettings,
				addHabit,
				updateHabit,
				deleteHabit,
				completeHabit,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error('useUser must be used within a UserProvider');
	}
	return context;
}
