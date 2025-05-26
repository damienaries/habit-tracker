import { NavLink } from 'react-router-dom';
import Icon from './icons/Icon';

export default function TabNavigation() {
	const getClassName = ({ isActive }) =>
		`link-nav-tabs ${isActive ? 'current' : ''}`;

	return (
		<nav className="w-full max-w-[800px] fixed bottom-0 left-0 bg-white text-gray-900 flex justify-around items-center h-20">
			<NavLink to="/" className={getClassName} end>
				<Icon icon="home" color="#6B7280" size="md" />
				<span className="text-xs mt-1">Home</span>
			</NavLink>
			<NavLink to="/create" className={getClassName}>
				<Icon icon="plus-circle" color="#6B7280" size="md" />
				<span className="text-xs mt-1">Create</span>
			</NavLink>
			<NavLink to="/habits" className={getClassName}>
				<Icon icon="list-bullet" color="#6B7280" size="md" />
				<span className="text-xs mt-1">Streaks</span>
			</NavLink>
		</nav>
	);
}
