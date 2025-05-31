import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import ButtonComponent from './elements/ButtonComponent';

export default function Onboarding() {
	const { login } = useUser();
	const [name, setName] = useState('');

	const handleSubmit = e => {
		e.preventDefault();
		if (!name.trim()) return;

		// Create a new user with default settings
		const newUser = {
			id: crypto.randomUUID(), // Generate a unique ID
			name: name.trim(),
			createdAt: new Date().toISOString(),
			settings: {
				morningNotifications: true,
				eveningNotifications: true,
			},
			habits: [], // Initialize empty habits array
		};

		login(newUser);
	};

	return (
		<div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Welcome to Habit Tracker</h1>
					<p className="mt-2 text-gray-600">Let's get started by setting up your profile</p>
				</div>

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
			</div>
		</div>
	);
}
