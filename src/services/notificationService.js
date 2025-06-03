import { isSameDay } from '../utils/dateHelpers';

export class NotificationService {
	static async requestPermission() {
		if (!('Notification' in window)) {
			console.log('This browser does not support notifications');
			return false;
		}

		try {
			const permission = await Notification.requestPermission();
			return permission === 'granted';
		} catch (error) {
			console.error('Error requesting notification permission:', error);
			return false;
		}
	}

	static async scheduleDailyNotifications(habits, settings) {
		if (!settings.morningNotifications && !settings.eveningNotifications) return;
		if (!('serviceWorker' in navigator)) return;

		try {
			const registration = await navigator.serviceWorker.ready;
			const today = new Date();

			// Schedule morning notification
			if (settings.morningNotifications) {
				const morningTime = new Date(today);
				morningTime.setHours(9, 0, 0, 0);
				const morningMessage = this.generateMorningMessage(habits);

				await registration.showNotification("Today's Habits", {
					body: morningMessage,
					icon: '/icon-192x192.png',
					badge: '/badge-72x72.png',
					tag: 'morning-habits',
					requireInteraction: true,
					actions: [{ action: 'open', title: 'Open App' }],
					timestamp: morningTime.getTime(),
				});
			}

			// Schedule evening notification
			if (settings.eveningNotifications) {
				const eveningTime = new Date(today);
				eveningTime.setHours(21, 0, 0, 0);
				const eveningMessage = this.generateEveningMessage(habits);

				await registration.showNotification('Habit Check-in', {
					body: eveningMessage,
					icon: '/icon-192x192.png',
					badge: '/badge-72x72.png',
					tag: 'evening-habits',
					requireInteraction: true,
					actions: [{ action: 'open', title: 'Open App' }],
					timestamp: eveningTime.getTime(),
				});
			}

			// Register periodic sync for background updates
			if ('periodicSync' in registration) {
				await registration.periodicSync.register('habit-notifications', {
					minInterval: 24 * 60 * 60 * 1000, // 24 hours
				});
			}
		} catch (error) {
			console.error('Error scheduling notifications:', error);
		}
	}

	static generateMorningMessage(habits) {
		const activeHabits = habits.filter(h => !h.endDate);
		if (activeHabits.length === 0) {
			return 'You have no active habits for today. Time to create some new ones!';
		}
		return `You have ${activeHabits.length} habit${activeHabits.length === 1 ? '' : 's'} to complete today. Let's make it a great day!`;
	}

	static generateEveningMessage(habits) {
		const activeHabits = habits.filter(h => !h.endDate);
		if (activeHabits.length === 0) {
			return 'You have no active habits for today.';
		}

		const completedToday = activeHabits.filter(h =>
			h.completedDates?.some(d => isSameDay(new Date(d), new Date()))
		).length;

		if (completedToday === activeHabits.length) {
			return "🎉 Congratulations! You've completed all your habits today!";
		}
		return `You've completed ${completedToday} out of ${activeHabits.length} habit${activeHabits.length === 1 ? '' : 's'} today. Keep going!`;
	}

	// Helper function to convert VAPID key
	static urlBase64ToUint8Array(base64String) {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}
}
