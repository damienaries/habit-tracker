import { NavLink } from 'react-router-dom';

// todo add icons to the tab navigation instead of emoji

export default function TabNavigation() {
	const getClassName = ({ isActive }) =>
		`link-nav-tabs ${isActive ? 'current' : ''}`;

	return (
		<nav className="w-full max-w-[800px] fixed bottom-0 left-0 bg-white text-gray-900 flex justify-around items-center h-20">
			<NavLink to="/" className={getClassName} end>
				🏠<span>Home</span>
			</NavLink>
			<NavLink to="/create" className={getClassName}>
				➕<span>Create</span>
			</NavLink>
			<NavLink to="/completed" className={getClassName}>
				✅<span>Completed</span>
			</NavLink>
		</nav>
	);
}
