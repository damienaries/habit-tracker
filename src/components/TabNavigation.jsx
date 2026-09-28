import { NavLink } from 'react-router-dom';
import Icon from './icons/Icon';

const TABS = [
	{ to: '/', icon: 'home', label: 'Today', end: true },
	{ to: '/week', icon: 'calendar-week', label: 'Week' },
	{ to: '/month', icon: 'calendar-month', label: 'Month' },
	{ to: '/create', icon: 'plus-circle', label: 'Add' },
	{ to: '/habits', icon: 'streak-up', label: 'Streaks' },
];

export default function TabNavigation() {
	return (
		<nav
			className="fixed bottom-0 inset-x-0 z-20 bg-[var(--c-surface)] border-t border-[var(--c-border)]"
			// Without this the labels sit under the home indicator in standalone mode.
			style={{ paddingBottom: 'var(--safe-bottom)' }}
		>
			<div className="mx-auto max-w-[520px] h-[var(--tabbar-h)] flex">
				{TABS.map(({ to, icon, label, end }) => (
					<NavLink
						key={to}
						to={to}
						end={end}
						className={({ isActive }) => `link-nav-tabs ${isActive ? 'current' : ''}`}
					>
						{({ isActive }) => (
							<>
								<Icon
									icon={icon}
									size="md"
									color={isActive ? 'var(--c-accent)' : 'var(--c-muted)'}
								/>
								<span>{label}</span>
							</>
						)}
					</NavLink>
				))}
			</div>
		</nav>
	);
}
