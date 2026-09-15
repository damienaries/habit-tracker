import { createContext, useContext, useState, useEffect } from 'react';
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
				setUser(userData);
			}
		} catch (error) {
			console.error('Error loading user:', error);
		}
		setLoading(false);
	};

	const selectProfile = async userData => {
		try {
			// Check if user already exists
			const existingUser = await db.users.where('name').equals(userData.name).first();
			let userId;

			if (existingUser) {
				userId = existingUser.id;
			} else {
				// Create a new profile
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
			console.error('Error selecting profile:', error);
		}
	};

	const clearProfile = () => {
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

	if (loading) {
		return null; // or a loading spinner
	}

	return (
		<UserContext.Provider
			value={{
				user,
				loading,
				selectProfile,
				clearProfile,
				updateUserSettings,
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
