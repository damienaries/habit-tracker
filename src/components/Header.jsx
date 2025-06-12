import { useLocation, matchRoutes } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import Settings from './Settings';

export default function Header({ routes }) {
	const location = useLocation();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const { user } = useUser();

	const matchedRoute = matchRoutes(routes, location)?.[0]?.route;
	const title = matchedRoute?.title || 'Page';

	function toggleSettings() {
		setIsSettingsOpen(!isSettingsOpen);
	}

	return (
		<>
			<header className="fixed top-0 w-full h-16 bg-white shadow-md flex items-center justify-center z-10 text-gray-900">
				<h1 className="text-xl font-bold">{title}</h1>
				<div
					onClick={toggleSettings}
					className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center gap-4 pr-4"
				>
					<div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-lg">
						{user?.name?.[0]?.toUpperCase() || '?'}
					</div>
				</div>
			</header>
			<Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
		</>
	);
}
