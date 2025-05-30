import { useState, useEffect } from 'react';
import Icon from './icons/Icon';

export default function Settings({ isOpen, onClose }) {
	const [settings, setSettings] = useState({
		notificationTime: '09:00',
		theme: 'light',
		streakReminders: true,
		weeklyReport: true,
		weekStartsOn: 'monday',
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});

	// Handle escape key press
	useEffect(() => {
		function handleEscape(e) {
			if (e.key === 'Escape') onClose();
		}
		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
		}
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	// Prevent body scroll when settings is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

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
				className={`fixed z-50 top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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
							<Icon icon="x" size="md" />
						</button>
					</div>

					{/* Settings Content */}
					<div className="flex-1 overflow-y-auto p-4 space-y-6">
						{/* Notification Time */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">
								Daily Reminder Time
							</label>
							<input
								type="time"
								value={settings.notificationTime}
								onChange={(e) =>
									setSettings({ ...settings, notificationTime: e.target.value })
								}
								className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						{/* Theme Selection */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">
								Theme
							</label>
							<select
								value={settings.theme}
								onChange={(e) =>
									setSettings({ ...settings, theme: e.target.value })
								}
								className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="light">Light</option>
								<option value="dark">Dark</option>
								<option value="system">System</option>
							</select>
						</div>

						{/* Streak Reminders */}
						<div className="flex items-center justify-between">
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Streak Reminders
								</label>
								<p className="text-sm text-gray-500">
									Get notified when you're about to break a streak
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={settings.streakReminders}
									onChange={(e) =>
										setSettings({
											...settings,
											streakReminders: e.target.checked,
										})
									}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
							</label>
						</div>

						{/* Weekly Report */}
						<div className="flex items-center justify-between">
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Weekly Progress Report
								</label>
								<p className="text-sm text-gray-500">
									Receive a weekly summary of your habits
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={settings.weeklyReport}
									onChange={(e) =>
										setSettings({ ...settings, weeklyReport: e.target.checked })
									}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
							</label>
						</div>

						{/* Week Start */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">
								Week Starts On
							</label>
							<select
								value={settings.weekStartsOn}
								onChange={(e) =>
									setSettings({ ...settings, weekStartsOn: e.target.value })
								}
								className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="monday">Monday</option>
								<option value="sunday">Sunday</option>
							</select>
						</div>

						{/* Timezone */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">
								Timezone
							</label>
							<select
								value={settings.timezone}
								onChange={(e) =>
									setSettings({ ...settings, timezone: e.target.value })
								}
								className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value={settings.timezone}>{settings.timezone}</option>
							</select>
						</div>
					</div>

					{/* Footer */}
					<div className="p-4 border-t">
						<button
							onClick={() => {
								// TODO: Save settings
								onClose();
							}}
							className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
						>
							Save Changes
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
