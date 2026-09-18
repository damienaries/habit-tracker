import { NavLink, useLocation } from 'react-router-dom';
import Icon from './icons/Icon';

const TABS = [
	{ to: '/', icon: 'home', label: 'Today', end: true },
	{ to: '/month', icon: null, label: null },
	{ to: '/create', icon: 'plus-circle', label: 'Create' },
	{ to: '/habits', icon: 'streak-up', label: 'Streaks' },
];

export default function TabNavigation() {
	const location = useLocation();

	const onCalendar = location.pathname === '/month';
	const weekActive = onCalendar && new URLSearchParams(location.search).get('view') === 'week';

	// The tab names the range you are in and flips when tapped again. Arriving
	// from another tab lands on month; there is no hidden gesture to discover.
	const calendar = {
		to: weekActive ? '/month' : '/month?view=week',
		icon: weekActive ? 'calendar-week' : 'calendar-month',
		label: weekActive ? 'Week' : 'Month',
	};

	return (
		<nav
			className="fixed bottom-0 inset-x-0 z-20 bg-[var(--c-surface)] border-t border-[var(--c-border)]"
			// Without this the labels sit under the home indicator in standalone mode.
			style={{ paddingBottom: 'var(--safe-bottom)' }}
		>
			<div className="mx-auto max-w-[520px] h-[var(--tabbar-h)] flex">
				{TABS.map(tab => {
					const isCalendar = tab.to === '/month';
					const to = isCalendar ? calendar.to : tab.to;
					const icon = isCalendar ? calendar.icon : tab.icon;
					const label = isCalendar ? calendar.label : tab.label;

					return (
						<NavLink
							key={tab.to}
							to={to}
							end={tab.end}
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
					);
				})}
			</div>
		</nav>
	);
}
