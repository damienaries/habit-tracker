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

	static async scheduleNotification(title, body, time) {
		if (!('serviceWorker' in navigator)) return;

		try {
			const registration = await navigator.serviceWorker.ready;
			const timestamp = new Date(time).getTime();

			await registration.showNotification(title, {
				body,
				icon: '/icon-192x192.png',
				badge: '/badge-72x72.png',
				tag: 'habit-reminder',
				timestamp,
				requireInteraction: true,
				actions: [
					{
						action: 'open',
						title: 'Open App',
					},
				],
			});
		} catch (error) {
			console.error('Error scheduling notification:', error);
		}
	}

	static async scheduleDailyNotifications(habits, settings) {
		if (!settings.morningNotifications && !settings.eveningNotifications) return;

		const today = new Date();
		const morningTime = new Date(today);
		morningTime.setHours(9, 0, 0, 0);

		const eveningTime = new Date(today);
		eveningTime.setHours(21, 0, 0, 0);

		if (settings.morningNotifications) {
			const morningMessage = this.generateMorningMessage(habits);
			await this.scheduleNotification("Today's Habits", morningMessage, morningTime);
		}

		if (settings.eveningNotifications) {
			const eveningMessage = this.generateEveningMessage(habits);
			await this.scheduleNotification('Habit Check-in', eveningMessage, eveningTime);
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

	static async registerPeriodicSync() {
		if (!('serviceWorker' in navigator) || !('periodicSync' in navigator.serviceWorker)) {
			console.log('Periodic Sync not supported');
			return;
		}

		try {
			const registration = await navigator.serviceWorker.ready;
			await registration.periodicSync.register('habit-notifications', {
				minInterval: 24 * 60 * 60 * 1000, // 24 hours
			});
		} catch (error) {
			console.error('Error registering periodic sync:', error);
		}
	}
}
