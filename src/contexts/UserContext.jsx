import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// Check for existing user session on mount
	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
		setLoading(false);
	}, []);

	// Update localStorage when user changes
	useEffect(() => {
		if (user) {
			localStorage.setItem('user', JSON.stringify(user));
		} else {
			localStorage.removeItem('user');
		}
	}, [user]);

	const login = userData => {
		setUser(userData);
	};

	const logout = () => {
		setUser(null);
	};

	const updateUserSettings = settings => {
		setUser(prev => ({
			...prev,
			settings: {
				...prev.settings,
				...settings,
			},
		}));
	};

	// Habit management methods
	const addHabit = habit => {
		setUser(prev => ({
			...prev,
			habits: [
				...(prev.habits || []),
				{ ...habit, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
			],
		}));
	};

	const updateHabit = (habitId, updates) => {
		setUser(prev => ({
			...prev,
			habits: prev.habits.map(habit => (habit.id === habitId ? { ...habit, ...updates } : habit)),
		}));
	};

	const deleteHabit = habitId => {
		setUser(prev => ({
			...prev,
			habits: prev.habits.filter(habit => habit.id !== habitId),
		}));
	};

	const completeHabit = (habitId, date = new Date().toISOString()) => {
		setUser(prev => ({
			...prev,
			habits: prev.habits.map(habit => {
				if (habit.id === habitId) {
					const completions = habit.completions || [];
					// Don't add duplicate completions for the same day
					if (!completions.some(c => c.date.startsWith(date.split('T')[0]))) {
						return {
							...habit,
							completions: [...completions, { date, id: crypto.randomUUID() }],
						};
					}
				}
				return habit;
			}),
		}));
	};

	if (loading) {
		return null; // or a loading spinner
	}

	return (
		<UserContext.Provider
			value={{
				user,
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
	if (context === undefined) {
		throw new Error('useUser must be used within a UserProvider');
	}
	return context;
}
