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

	static async registerForPushNotifications(userId, habits, settings) {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			console.log('Push notifications not supported');
			return false;
		}

		try {
			// Register service worker
			const registration = await navigator.serviceWorker.register('/sw.js');
			await navigator.serviceWorker.ready;

			// Subscribe to push notifications
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: this.urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
			});

			// Send subscription to backend
			const response = await fetch('/.netlify/functions/send-notifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'subscribe',
					subscription,
					userId,
					habits,
					settings,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to register subscription');
			}

			console.log('Successfully registered for push notifications');
			return true;
		} catch (error) {
			console.error('Error registering for push notifications:', error);
			return false;
		}
	}

	static async updateNotificationSettings(userId, habits, settings) {
		// Re-register with new settings
		return this.registerForPushNotifications(userId, habits, settings);
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
