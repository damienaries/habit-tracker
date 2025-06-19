/* eslint-env serviceworker */
// Service Worker for Push Notifications
self.addEventListener('push', function (event) {
	if (event.data) {
		const data = event.data.json();

		const options = {
			body: data.body,
			icon: data.icon,
			badge: data.badge,
			tag: data.tag,
			requireInteraction: data.requireInteraction,
			actions: data.actions,
			vibrate: data.vibrate,
			data: {
				url: self.location.origin,
			},
		};

		event.waitUntil(self.registration.showNotification(data.title, options));
	}
});

self.addEventListener('notificationclick', function (event) {
	event.notification.close();

	if (event.action === 'open') {
		event.waitUntil(clients.openWindow(event.notification.data.url));
	} else {
		// Default action - open the app
		event.waitUntil(clients.openWindow(event.notification.data.url));
	}
});

self.addEventListener('notificationclose', function (event) {
	console.log('Notification closed:', event.notification.tag);
});
