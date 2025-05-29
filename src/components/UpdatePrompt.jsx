import { useState, useEffect } from 'react';
import ButtonComponent from './elements/ButtonComponent';

export function UpdatePrompt() {
	const [showReload, setShowReload] = useState(false);
	const [registration, setRegistration] = useState(null);

	useEffect(() => {
		// Listen for the service worker update
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready.then((reg) => {
				setRegistration(reg);
				reg.addEventListener('updatefound', () => {
					const newWorker = reg.installing;
					newWorker.addEventListener('statechange', () => {
						if (
							newWorker.state === 'installed' &&
							navigator.serviceWorker.controller
						) {
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

	if (!showReload) return null;

	return (
		<div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
			<p className="text-sm text-gray-700 mb-2">A new version is available!</p>
			<ButtonComponent onClick={reloadPage} variant="primary" size="sm">
				Update Now
			</ButtonComponent>
		</div>
	);
}
