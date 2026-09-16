import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Icon from './icons/Icon';
import ButtonComponent from './elements/ButtonComponent';
import ToggleButton from './elements/ToggleButton';
import { useUser } from '../contexts/UserContext';
import { NotificationService } from '../services/notificationService';
import { getAllHabits } from '../services/habitService';
import { buildCalendar } from '../services/icsExport';
import { calendarUrl } from '../services/calendarDelivery';
import { formatBuild } from '../services/buildInfo';
import { habitKeys } from '../queries/habitKeys';

const SKIP_REASONS = {
	'no-days': 'no days chosen, so there is nothing to schedule',
	paused: 'paused',
	finished: 'finished or quit',
	'day-full': 'no room left in the day',
};

export default function Settings({ isOpen, onClose }) {
	const { user, updateUserSettings, clearProfile } = useUser();
	const { data: habits = [] } = useQuery({
		queryKey: habitKeys.byUser(user?.id),
		queryFn: () => getAllHabits(user.id),
		enabled: !!user,
	});

	// Built up front so the button can be a real link. A programmatic
	// window.open is treated as a popup and, in a standalone PWA, navigates the
	// app away instead of handing the file to the OS.
	const calendar = useMemo(() => {
		if (habits.length === 0) return null;

		const { ics, scheduled, skipped } = buildCalendar(habits);
		return {
			url: calendarUrl(ics, window.location.origin),
			count: scheduled.length,
			total: habits.length,
			skipped,
		};
	}, [habits]);

	const [settings, setSettings] = useState({
		morningNotifications: user?.settings?.morningNotifications ?? true,
		eveningNotifications: user?.settings?.eveningNotifications ?? true,
	});
	const [notificationPermission, setNotificationPermission] = useState('default');
	const [isRegistering, setIsRegistering] = useState(false);

	useEffect(() => {
		if ('Notification' in window) {
			setNotificationPermission(Notification.permission);
		}
	}, []);

	const handleSettingChange = async (key, value) => {
		if (value && notificationPermission !== 'granted') {
			const granted = await NotificationService.requestPermission();
			if (!granted) {
				// Show error message or handle permission denied
				return;
			}
			setNotificationPermission('granted');
		}

		setSettings(prev => ({ ...prev, [key]: value }));
		updateUserSettings({ [key]: value });

		// Register for push notifications if enabled
		if (value && user?.id) {
			setIsRegistering(true);
			try {
				await NotificationService.registerForPushNotificationsDebounced(user.id, habits, {
					...user.settings,
					[key]: value,
				});
			} catch (error) {
				console.error('Failed to update notification settings:', error);
			} finally {
				setIsRegistering(false);
			}
		}
	};

	// Register for notifications when component mounts
	useEffect(() => {
		if (user?.id && (settings.morningNotifications || settings.eveningNotifications)) {
			console.log('Settings: Registering notifications on mount');
			NotificationService.registerForPushNotificationsDebounced(user.id, habits, settings);
		}
	}, [user?.id, settings.morningNotifications, settings.eveningNotifications]);

	// Format the creation date
	const formatDate = dateString => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const handleSwitchProfile = () => {
		clearProfile();
		onClose();
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 bg-white transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
					isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
				}`}
				onClick={onClose}
			/>

			{/* Settings Panel */}
			<div
				className={`fixed z-50 top-0 right-0 h-full w-full bg-white shadow-xl transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
					isOpen ? 'translate-x-0' : 'translate-x-full'
				}`}
			>
				<div className="h-full flex flex-col">
					{/* Header */}
					<div className="p-4 border-b flex items-center justify-between">
						<h2 className="text-xl font-semibold">Settings</h2>
						<button
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-full transition-colors"
						>
							<Icon icon="x" size="lg" />
						</button>
					</div>

					{/* Settings Content */}
					<div className="flex-1 overflow-y-auto p-4 space-y-6">
						{/* User Profile Section */}
						<div className="pb-4 border-b border-gray-200">
							<h3 className="text-xl text-center font-medium text-gray-900 capitalize">
								{user?.name}
							</h3>
							<p className="text-center text-sm text-gray-500 mt-1">
								Building habits since {formatDate(user?.createdAt)}
							</p>
						</div>

						{/* Notifications Section */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-gray-900">Notifications</h3>

							{notificationPermission === 'denied' && (
								<div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800">
									Notifications are blocked. Please enable them in your browser settings.
								</div>
							)}

							{isRegistering && (
								<div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
									Updating notification settings...
								</div>
							)}

							{/* Morning Notifications */}
							<div className="flex items-center justify-between py-2">
								<div>
									<label className="block text-lg font-medium text-gray-700">Morning Recap</label>
									<p className="text-gray-500">Daily summary of your habits at 9AM</p>
								</div>
								<ToggleButton
									checked={settings.morningNotifications}
									onChange={e => handleSettingChange('morningNotifications', e.target.checked)}
									disabled={notificationPermission === 'denied' || isRegistering}
								/>
							</div>

							{/* Evening Notifications */}
							<div className="flex items-center justify-between py-2">
								<div>
									<label className="block text-lg font-medium text-gray-700">
										Evening Reminder
									</label>
									<p className="text-gray-500">Reminder to complete your habits at 9PM</p>
								</div>
								<ToggleButton
									checked={settings.eveningNotifications}
									onChange={e => handleSettingChange('eveningNotifications', e.target.checked)}
									disabled={notificationPermission === 'denied' || isRegistering}
								/>
							</div>
						</div>

						{/* Calendar */}
						<div className="space-y-3">
							<h3 className="text-lg font-medium text-gray-900">Calendar</h3>

							{calendar === null ? (
								<p className="text-sm text-gray-500">No habits yet.</p>
							) : (
								<>
									<p className="text-sm text-gray-500">
										{calendar.count} of {calendar.total} habit
										{calendar.total === 1 ? '' : 's'} can be added as recurring events.
									</p>

									{calendar.skipped.length > 0 && (
										<ul className="text-xs text-gray-500 space-y-1">
											{calendar.skipped.map(({ habit, reason }) => (
												<li key={habit.id}>
													<span className="text-gray-700">{habit.name}</span> —{' '}
													{SKIP_REASONS[reason] || reason}
												</li>
											))}
										</ul>
									)}

									{calendar.count > 0 && calendar.url && (
										<ButtonComponent
											href={calendar.url}
											target="_blank"
											rel="noopener"
											variant="secondary"
											fullWidth
										>
											Add to calendar
										</ButtonComponent>
									)}

									{calendar.count > 0 && !calendar.url && (
										<p className="text-sm text-amber-700">
											Too many habits to send this way — we would need a different
											export route.
										</p>
									)}
								</>
							)}
						</div>

						{/* Account Section */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-gray-900">Account</h3>
							<ButtonComponent onClick={handleSwitchProfile} variant="danger" fullWidth>
								Switch profile
							</ButtonComponent>
						</div>
					</div>

					{/* Footer */}
					<div className="p-4 border-t space-y-3">
						<p className="text-center text-xs text-gray-400">Build {formatBuild()}</p>
						<ButtonComponent onClick={onClose} variant="primary" size="lg" fullWidth>
							Done
						</ButtonComponent>
					</div>
				</div>
			</div>
		</>
	);
}
