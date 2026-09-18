import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import Settings from './Settings';
import Icon from './icons/Icon';

export default function Header() {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const { user } = useUser();

	return (
		<>
			<header
				className="fixed top-0 inset-x-0 z-20 bg-[var(--c-bg)]/90 backdrop-blur border-b border-[var(--c-border)]"
				style={{ paddingTop: 'var(--safe-top)' }}
			>
				<div className="mx-auto max-w-[520px] h-[var(--header-h)] px-4 flex items-center justify-between">
					<span
						className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--c-accent-soft)]"
						aria-label="Habit tracker"
					>
						<Icon icon="fire" color="var(--c-accent)" size="md" />
					</span>

					<button
						type="button"
						onClick={() => setIsSettingsOpen(true)}
						aria-label="Settings"
						className="w-9 h-9 -mr-2 grid place-items-center rounded-full transition-colors hover:bg-[var(--c-surface-sunk)]"
					>
						<span className="w-[30px] h-[30px] rounded-full bg-[var(--c-text)] text-white grid place-items-center font-semibold text-sm">
							{user?.name?.[0]?.toUpperCase() || '?'}
						</span>
					</button>
				</div>
			</header>

			<Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
		</>
	);
}
