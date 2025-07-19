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

			// Unsubscribe from any existing subscription first
			const existingSubscription = await registration.pushManager.getSubscription();
			if (existingSubscription) {
				await existingSubscription.unsubscribe();
				console.log('Unsubscribed from existing push notification subscription');
			}

			// Subscribe to push notifications
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: this.urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
			});

			// Generate unique device ID
			const deviceId = this.getDeviceId();
			const uniqueUserId = `${userId}-${deviceId}`;

			// Send subscription to backend
			console.log('Sending subscription to backend...');
			const response = await fetch('/.netlify/functions/send-notifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'subscribe',
					subscription,
					userId: uniqueUserId,
					originalUserId: userId,
					deviceId,
					habits,
					settings,
				}),
			});

			console.log('Response status:', response.status);
			console.log('Response ok:', response.ok);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Response error:', errorText);
				throw new Error(`Failed to register subscription: ${response.status} ${errorText}`);
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

	static async clearAllPushSubscriptions(userId) {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			console.log('Push notifications not supported');
			return false;
		}

		try {
			// Unsubscribe from push manager
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				const subscription = await registration.pushManager.getSubscription();
				if (subscription) {
					await subscription.unsubscribe();
					console.log('Cleared existing push notification subscription');
				}
			}

			// Also notify backend to remove subscription
			if (userId) {
				const deviceId = this.getDeviceId();
				const uniqueUserId = `${userId}-${deviceId}`;

				const response = await fetch('/.netlify/functions/send-notifications', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						action: 'unsubscribe',
						userId: uniqueUserId,
						originalUserId: userId,
						deviceId,
					}),
				});

				if (response.ok) {
					console.log('Successfully unsubscribed from backend');
				}
			}

			return true;
		} catch (error) {
			console.error('Error clearing push subscriptions:', error);
			return false;
		}
	}

	// Generate a unique device ID
	static getDeviceId() {
		// Try to get existing device ID from localStorage
		let deviceId = localStorage.getItem('deviceId');

		if (!deviceId) {
			// Generate a new device ID
			deviceId = crypto.randomUUID();
			localStorage.setItem('deviceId', deviceId);
		}

		return deviceId;
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
