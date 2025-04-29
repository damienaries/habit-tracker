import { NavLink } from 'react-router-dom';

export default function TabNavigation() {
	return (
		<nav className="fixed bottom-0 left-0 bg-white border-t flex justify-around items-center h-16">
			<NavLink to="/" className="flex flex-col items-center text-gray-600" end>
				🏠
				<span className="text-xs">Home</span>
			</NavLink>
			<NavLink
				to="/create"
				className="flex flex-col items-center text-gray-600"
			>
				➕<span className="text-xs">Create</span>
			</NavLink>
			<NavLink
				to="/completed"
				className="flex flex-col items-center text-gray-600"
			>
				✅<span className="text-xs">Completed</span>
			</NavLink>
		</nav>
	);
}
