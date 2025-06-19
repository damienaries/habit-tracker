const webpush = require('web-push');

// Configure VAPID keys
const vapidKeys = {
	publicKey: process.env.VITE_VAPID_PUBLIC_KEY,
	privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
	'mailto:your-email@example.com', // Replace with your email
	vapidKeys.publicKey,
	vapidKeys.privateKey
);

// Simple in-memory storage
let subscriptions = [];

exports.handler = async (event, context) => {
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	};

	if (event.httpMethod === 'OPTIONS') {
		return { statusCode: 200, headers, body: '' };
	}

	try {
		const { httpMethod, body } = event;

		if (httpMethod === 'POST') {
			const data = JSON.parse(body);

			if (data.action === 'subscribe') {
				// Store subscription
				const { subscription, userId, settings, habits } = data;

				// Remove existing subscription for this user
				subscriptions = subscriptions.filter(sub => sub.userId !== userId);

				// Add new subscription
				subscriptions.push({ userId, subscription, settings, habits });

				return {
					statusCode: 200,
					headers: { ...headers, 'Content-Type': 'application/json' },
					body: JSON.stringify({ success: true }),
				};
			}

			if (data.action === 'send-notifications') {
				const currentHour = new Date().getHours();
				const isMorning = currentHour >= 8 && currentHour <= 10;
				const isEvening = currentHour >= 20 && currentHour <= 22;

				if (!isMorning && !isEvening) {
					return {
						statusCode: 200,
						headers: { ...headers, 'Content-Type': 'application/json' },
						body: JSON.stringify({ message: 'Not notification time' }),
					};
				}

				const notificationsSent = [];

				for (const userData of subscriptions) {
					const { subscription, settings, habits, userId } = userData;

					// Check user preferences
					if (isMorning && !settings.morningNotifications) continue;
					if (isEvening && !settings.eveningNotifications) continue;

					const message = isMorning
						? generateMorningMessage(habits)
						: generateEveningMessage(habits);

					const title = isMorning ? "Today's Habits" : 'Habit Check-in';

					try {
						await webpush.sendNotification(
							subscription,
							JSON.stringify({
								title,
								body: message,
								icon: '/icons/fire.svg',
								badge: '/icons/fire.svg',
								tag: isMorning ? 'morning-habits' : 'evening-habits',
								requireInteraction: true,
								actions: [{ action: 'open', title: 'Open App' }],
								vibrate: [200, 100, 200],
							})
						);

						notificationsSent.push(userId);
					} catch (error) {
						console.error(`Failed to send notification to user ${userId}:`, error);
						if (error.statusCode === 410) {
							subscriptions = subscriptions.filter(sub => sub.userId !== userId);
						}
					}
				}

				return {
					statusCode: 200,
					headers: { ...headers, 'Content-Type': 'application/json' },
					body: JSON.stringify({
						success: true,
						notificationsSent,
						totalSubscriptions: subscriptions.length,
					}),
				};
			}
		}

		return {
			statusCode: 400,
			headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ error: 'Invalid request' }),
		};
	} catch (error) {
		console.error('Function error:', error);
		return {
			statusCode: 500,
			headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ error: 'Internal server error' }),
		};
	}
};

function generateMorningMessage(habits) {
	const activeHabits = habits.filter(h => !h.endDate);
	if (activeHabits.length === 0) {
		return 'You have no active habits for today. Time to create some new ones!';
	}
	return `You have ${activeHabits.length} habit${activeHabits.length === 1 ? '' : 's'} to complete today. Let's make it a great day!`;
}

function generateEveningMessage(habits) {
	const activeHabits = habits.filter(h => !h.endDate);
	if (activeHabits.length === 0) {
		return 'You have no active habits for today.';
	}

	const today = new Date().toDateString();
	const completedToday = activeHabits.filter(h =>
		h.completedDates?.some(d => new Date(d).toDateString() === today)
	).length;

	if (completedToday === activeHabits.length) {
		return "🎉 Congratulations! You've completed all your habits today! Keep up the great work!";
	}

	const incompleteHabits = activeHabits.length - completedToday;
	return `You still have ${incompleteHabits} habit${incompleteHabits === 1 ? '' : 's'} to complete today. Don't forget to check them off!`;
}
