import { isSameDay, getLocalDateKey } from '../utils/dateHelpers';
import { useToggleHabitCompletion } from '../hooks/useHabitMutations';
import { isPausedNow } from '../services/schedule';

export default function HabitCheckbox({ habit, date, editing = false }) {
	const isToday = isSameDay(date, new Date());
	const isPaused = isPausedNow(habit);
	const isDone = (habit.completions || []).includes(getLocalDateKey(date));

	const mutation = useToggleHabitCompletion();
	const locked = (!isToday && !editing) || mutation.isPending || isPaused;

	const handleToggle = e => {
		e.stopPropagation();
		if (locked) return;
		mutation.mutate({ habit, date });
	};

	return (
		// 36px of hit area around a 24px mark. The original was a 20px box with no
		// padding around it, which was hard to hit on the move.
		<button
			type="button"
			onClick={handleToggle}
			disabled={locked}
			aria-pressed={isDone}
			aria-label={isDone ? `Mark ${habit.name} as not done` : `Mark ${habit.name} as done`}
			className={`shrink-0 grid place-items-center w-9 h-9 -my-1 -ml-1 rounded-full
				transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)]
				${locked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
		>
			<span
				className={`grid place-items-center w-[24px] h-[24px] rounded-[8px] border-2
					transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)]
					${
						isDone
							? 'bg-[var(--c-done)] border-[var(--c-done)] scale-105'
							: 'bg-transparent border-[var(--c-border-strong)] scale-100'
					}
					${locked ? 'opacity-40' : ''}`}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="3.25"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					className={`w-[14px] h-[14px] text-white transition-opacity duration-[var(--dur-quick)] ${
						isDone ? 'opacity-100' : 'opacity-0'
					}`}
				>
					<path d="M20 6 9 17l-5-5" />
				</svg>
			</span>
		</button>
	);
}
