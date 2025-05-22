import { useLocation, matchRoutes } from 'react-router-dom';

export default function Header({ routes }) {
	const location = useLocation();

	// Match the current route to get the title
	const matchedRoute = matchRoutes(routes, location)?.[0]?.route;
	const title = matchedRoute?.title || 'Page';

	return (
		<header className="fixed top-0 w-full h-16 bg-white shadow-md flex items-center justify-center z-10">
			<h1 className="text-xl font-bold">{title}</h1>
		</header>
	);
}
