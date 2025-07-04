import { useState, useEffect } from 'react';
import ButtonComponent from './elements/ButtonComponent';

export function UpdatePrompt() {
	const [showReload, setShowReload] = useState(false);
	const [registration, setRegistration] = useState(null);

	useEffect(() => {
		// Don't show update prompt in development mode
		if (import.meta.env.DEV) return;

		// Listen for the service worker update
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready.then(reg => {
				setRegistration(reg);
				reg.addEventListener('updatefound', () => {
					const newWorker = reg.installing;
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							setShowReload(true);
						}
					});
				});
			});
		}
	}, []);

	const reloadPage = () => {
		if (registration && registration.waiting) {
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
		window.location.reload();
	};

	const closePrompt = () => {
		setShowReload(false);
	};

	if (!showReload) return null;

	return (
		<div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
			<button
				onClick={closePrompt}
				className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg font-bold leading-none cursor-pointer"
				aria-label="Close update prompt"
			>
				×
			</button>
			<p className="text-sm text-gray-700 mb-2 pr-6">A new version is available!</p>
			<ButtonComponent onClick={reloadPage} variant="primary" size="sm">
				Update Now
			</ButtonComponent>
		</div>
	);
}
