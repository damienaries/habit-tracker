const webpush = require('web-push');
const fs = require('fs');

// Configure VAPID keys
const vapidKeys = {
	publicKey: process.env.VITE_VAPID_PUBLIC_KEY,
	privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
	'mailto:damien.aries@gmail.com', // Replace with your email
	vapidKeys.publicKey,
	vapidKeys.privateKey
);

// File-based storage for subscriptions
const SUBSCRIPTIONS_FILE = '/tmp/subscriptions.json';

function loadSubscriptions() {
	try {
		if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
			const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
			return JSON.parse(data);
		}
	} catch (error) {
		console.error('Error loading subscriptions:', error);
	}
	return [];
}

function saveSubscriptions(subscriptions) {
	try {
		fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
	} catch (error) {
		console.error('Error saving subscriptions:', error);
	}
}

exports.handler = async (event, _context) => {
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

		if (httpMethod === 'GET') {
			return {
				statusCode: 200,
				headers: { ...headers, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: 'Notification function is working!',
					timestamp: new Date().toISOString(),
					totalSubscriptions: loadSubscriptions().length,
				}),
			};
		}

		if (httpMethod === 'POST') {
			const data = JSON.parse(body);

			if (data.action === 'subscribe') {
				// Store subscription
				const { subscription, userId, settings, habits } = data;

				console.log(`Storing subscription for user ${userId}`);

				// Load existing subscriptions
				const subscriptions = loadSubscriptions();

				// Remove existing subscription for this user
				const filteredSubscriptions = subscriptions.filter(sub => sub.userId !== userId);

				// Add new subscription
				filteredSubscriptions.push({ userId, subscription, settings, habits });

				// Save to file
				saveSubscriptions(filteredSubscriptions);

				console.log(
					`Successfully stored subscription. Total subscriptions: ${filteredSubscriptions.length}`
				);

				return {
					statusCode: 200,
					headers: { ...headers, 'Content-Type': 'application/json' },
					body: JSON.stringify({ success: true, totalSubscriptions: filteredSubscriptions.length }),
				};
			}

			if (data.action === 'send-notifications') {
				const currentHour = new Date().getHours();
				const isMorning = currentHour >= 8 && currentHour <= 10;
				const isEvening = currentHour >= 20 && currentHour <= 22;

				console.log(
					`Notification check - Hour: ${currentHour}, Morning: ${isMorning}, Evening: ${isEvening}`
				);

				if (!isMorning && !isEvening) {
					return {
						statusCode: 200,
						headers: { ...headers, 'Content-Type': 'application/json' },
						body: JSON.stringify({ message: 'Not notification time' }),
					};
				}

				// Load subscriptions from file
				const subscriptions = loadSubscriptions();
				console.log(`Loaded ${subscriptions.length} subscriptions`);

				const notificationsSent = [];

				for (const userData of subscriptions) {
					const { subscription, settings, habits, userId } = userData;

					// Check user preferences
					if (isMorning && !settings.morningNotifications) {
						console.log(`Skipping morning notification for user ${userId} - disabled`);
						continue;
					}
					if (isEvening && !settings.eveningNotifications) {
						console.log(`Skipping evening notification for user ${userId} - disabled`);
						continue;
					}

					const message = isMorning
						? generateMorningMessage(habits)
						: generateEveningMessage(habits);

					const title = isMorning ? "Today's Habits" : 'Habit Check-in';

					console.log(
						`Sending ${isMorning ? 'morning' : 'evening'} notification to user ${userId}: ${title}`
					);

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
						console.log(`Successfully sent notification to user ${userId}`);
					} catch (error) {
						console.error(`Failed to send notification to user ${userId}:`, error);
						if (error.statusCode === 410) {
							// Remove invalid subscription
							const updatedSubscriptions = subscriptions.filter(sub => sub.userId !== userId);
							saveSubscriptions(updatedSubscriptions);
							console.log(`Removed invalid subscription for user ${userId}`);
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

			if (data.action === 'unsubscribe') {
				const { userId } = data;
				console.log(`Unsubscribing user ${userId}`);

				const subscriptions = loadSubscriptions();
				const filteredSubscriptions = subscriptions.filter(sub => sub.userId !== userId);
				saveSubscriptions(filteredSubscriptions);

				console.log(
					`Unsubscribed user ${userId}. Total subscriptions: ${filteredSubscriptions.length}`
				);

				return {
					statusCode: 200,
					headers: { ...headers, 'Content-Type': 'application/json' },
					body: JSON.stringify({ success: true, totalSubscriptions: filteredSubscriptions.length }),
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
