import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import ButtonComponent from './elements/ButtonComponent';
import Icon from './icons/Icon';

export default function Onboarding() {
	const { login, logout, user } = useUser();
	const [name, setName] = useState('');
	const [showInstructions, setShowInstructions] = useState(false);
	const [deviceType, setDeviceType] = useState('desktop');

	useEffect(() => {
		// Detect device type
		const userAgent = navigator.userAgent.toLowerCase();
		if (/iphone|ipad|ipod/.test(userAgent)) {
			setDeviceType('ios');
		} else if (/android/.test(userAgent)) {
			setDeviceType('android');
		} else {
			setDeviceType('desktop');
		}
	}, []);

	const handleSubmit = e => {
		e.preventDefault();
		if (!name.trim()) return;

		// Create a new user with default settings
		const newUser = {
			id: crypto.randomUUID(),
			name: name.trim(),
			createdAt: new Date(),
			settings: {
				morningNotifications: true,
				eveningNotifications: true,
			},
			habits: [],
		};

		login(newUser);
	};

	const handleLogout = () => {
		logout();
		setName('');
	};

	const InstallationInstructions = () => {
		const instructions = {
			ios: {
				title: 'Install on iPhone/iPad',
				steps: [
					'Open Safari and navigate to this page',
					'Tap the Share button (square with arrow pointing up)',
					'Scroll down and tap "Add to Home Screen"',
					'Tap "Add" to install',
				],
			},
			android: {
				title: 'Install on Android',
				steps: [
					'Open Chrome and navigate to this page',
					'Tap the menu (three dots) in the top right',
					'Select "Add to Home screen" or "Install app"',
					'Follow the prompts to complete installation',
				],
			},
			desktop: {
				title: 'Install on Desktop',
				steps: [
					'Open Chrome/Edge and navigate to this page',
					'Click the install icon in the address bar (or press Ctrl+Shift+I)',
					'Click "Install" in the prompt that appears',
				],
			},
		};

		const currentInstructions = instructions[deviceType];

		return (
			<div className="mt-8 space-y-4">
				<button
					onClick={() => setShowInstructions(!showInstructions)}
					className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
				>
					<div className="flex items-center gap-2">
						<Icon icon="download" size="md" />
						<span className="font-medium">{currentInstructions.title}</span>
					</div>
					<Icon
						icon="chevron-down"
						size="md"
						className={`transition-transform duration-300 ease-in-out ${showInstructions ? 'rotate-180' : ''}`}
					/>
				</button>

				<div
					className={`grid transition-all duration-300 ease-in-out ${
						showInstructions ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
					}`}
				>
					<div className="overflow-hidden">
						<div className="p-4 bg-gray-50 rounded-lg">
							<ol className="list-decimal list-inside space-y-2 text-gray-600">
								{currentInstructions.steps.map((step, index) => (
									<li key={index}>{step}</li>
								))}
							</ol>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Welcome to Habit Tracker</h1>
					<p className="mt-2 text-gray-600">
						{user
							? 'Manage your profile or install the app'
							: "Let's get started by setting up your profile"}
					</p>
				</div>

				{user ? (
					<div className="space-y-6">
						<div className="text-center">
							<p className="text-gray-600">
								Currently logged in as: <span className="font-medium">{user.name}</span>
							</p>
						</div>

						<div className="flex gap-4 justify-center">
							<ButtonComponent onClick={handleLogout} variant="danger">
								Logout
							</ButtonComponent>
						</div>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="mt-8 space-y-6">
						<div>
							<label htmlFor="name" className="block text-sm font-medium text-gray-700">
								What should we call you?
							</label>
							<input
								type="text"
								id="name"
								value={name}
								onChange={e => setName(e.target.value)}
								placeholder="Enter your name"
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
								required
							/>
						</div>

						<ButtonComponent type="submit" variant="primary" size="lg" fullWidth>
							Get Started
						</ButtonComponent>
					</form>
				)}

				{/* Installation Instructions */}
				<InstallationInstructions />
			</div>
		</div>
	);
}
