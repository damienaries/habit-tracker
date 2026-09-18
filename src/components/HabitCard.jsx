import { useMemo, useState } from 'react';
import HabitCheckbox from './HabitCheckbox';
import HabitEditPanel from './HabitEditPanel';
import Icon from './icons/Icon';
import ButtonComponent from './elements/ButtonComponent';
import { formatDateTitle, getLocalDateKey, getStartOfWeek } from '../utils/dateHelpers';
import { FREQUENCY, END_REASON, isPausedNow } from '../services/schedule';
import { calculateStreaks } from '../services/streaks';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatFrequency(habit) {
	switch (habit.frequency) {
		case FREQUENCY.DAILY:
			return 'Every day';
		case FREQUENCY.SPECIFIC_DAYS: {
			const days = (habit.daysOfWeek || []).map(d => DAY_NAMES[d]);
			return days.length > 0 ? `Every ${days.join(', ')}` : 'No days set';
		}
		case FREQUENCY.WEEKLY: {
			const n = habit.timesPerPeriod || 1;
			if (n === 1) return 'Once a week';
			if (n === 2) return 'Twice a week';
			return `${n} times a week`;
		}
		default:
			return habit.frequency;
	}
}

// Ticking a flexible habit used to move nothing until the whole week's target
// landed. Dots fill on every completion.
function WeekDots({ completed, total }) {
	return (
		<span className="inline-flex items-center gap-1" aria-label={`${completed} of ${total} this week`}>
			{Array.from({ length: total }, (_, i) => (
				<span
					key={i}
					className="w-[7px] h-[7px] rounded-full transition-colors duration-[var(--dur-base)]"
					style={{ background: i < completed ? 'var(--c-done)' : 'var(--c-idle)' }}
				/>
			))}
		</span>
	);
}

function StreakRow({ label, streak, unit }) {
	return (
		<div className="flex flex-wrap gap-x-2">
			<span className="text-[var(--c-text-soft)] font-medium">{label}</span>
			<span className="numerals">
				{streak.current} {unit}
				{streak.current === 1 ? '' : 's'} now
			</span>
			<span className="text-[var(--c-muted)] numerals">
				best {streak.best} · last {streak.last} · {streak.total} total
			</span>
		</div>
	);
}

export default function HabitCard({ habit, date, dayCard = true, editing = false }) {
	const [isEditing, setIsEditing] = useState(false);

	const isWeeklyHabit = habit.frequency === FREQUENCY.WEEKLY;
	const isFinished = habit.endDate != null;
	const wasQuit = habit.endReason === END_REASON.QUIT;
	const isPaused = isPausedNow(habit);

	const completions = useMemo(() => habit.completions || [], [habit.completions]);
	const alreadyDone = completions.includes(getLocalDateKey(date));

	// Stable per habit so the colour never shuffles between renders.
	const habitHue = useMemo(() => {
		const key = String(habit.id);
		let hash = 0;
		for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
		return `var(--h-${(hash % 5) + 1})`;
	}, [habit.id]);

	// Derived from history on every read, so correcting a past day shows up
	// immediately and the number can never drift from the record.
	const streaks = useMemo(() => calculateStreaks(habit), [habit]);
	const headlineStreak = streaks.days ? streaks.days.current : streaks.weeks.current;
	const iconScale = Math.min(1 + Math.floor(headlineStreak / 5) * 0.25, 2);

	const weeklyProgress = useMemo(() => {
		if (!isWeeklyHabit) return null;

		const weekStart = getStartOfWeek(date);
		const keys = new Set();
		for (let i = 0; i < 7; i++) {
			const day = new Date(weekStart);
			day.setDate(weekStart.getDate() + i);
			keys.add(getLocalDateKey(day));
		}

		const completed = completions.filter(key => keys.has(key)).length;
		const total = habit.timesPerPeriod || 1;

		return { completed, total, isWeekComplete: completed >= total };
	}, [isWeeklyHabit, completions, date, habit.timesPerPeriod]);

	// While editing the card goes neutral: a green "done" ground under a form
	// makes every field harder to read.
	const surface = isEditing
		? 'bg-[var(--c-surface)] border-[var(--c-border-strong)]'
		: alreadyDone
			? 'bg-[var(--c-done-soft)] border-[color-mix(in_srgb,var(--c-done)_28%,transparent)]'
			: 'bg-[var(--c-surface)] border-[var(--c-border)]';

	return (
		<div
			className={`relative overflow-hidden rounded-[var(--radius)] w-full p-3.5 border
				transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)]
				${surface} ${isPaused ? 'opacity-60' : ''}`}
		>
			<span
				aria-hidden="true"
				className="absolute left-0 inset-y-0 w-[3px]"
				style={{ background: habitHue }}
			/>

			<div className="flex items-start gap-3">
				{dayCard && <HabitCheckbox habit={habit} date={date} editing={editing} />}

				<div className="flex-1 min-w-0">
					<div className="font-semibold capitalize flex items-center gap-2 leading-snug">
						{habit.name}
						{isPaused && (
							<span className="text-[0.7rem] bg-[var(--c-surface-sunk)] text-[var(--c-muted)] px-2 py-0.5 rounded-full">
								Paused
							</span>
						)}
						{isFinished && (
							<span
								className={`text-[0.7rem] px-2 py-0.5 rounded-full ${
									wasQuit
										? 'bg-[var(--c-surface-sunk)] text-[var(--c-muted)]'
										: 'bg-[var(--c-done-soft)] text-[var(--c-done)]'
								}`}
							>
								{wasQuit ? 'Quit' : 'Finished'}
							</span>
						)}
					</div>

					{!isEditing && (
						<>
							{habit.details && dayCard && (
								<p className="text-[0.78rem] text-[var(--c-muted)] mt-0.5">{habit.details}</p>
							)}

							{isWeeklyHabit && dayCard && (
								<div className="flex items-center gap-2 mt-1.5">
									<WeekDots completed={weeklyProgress.completed} total={weeklyProgress.total} />
									<span className="text-[0.75rem] text-[var(--c-muted)] numerals">
										{weeklyProgress.isWeekComplete
											? 'done for this week'
											: `${weeklyProgress.completed} of ${weeklyProgress.total} this week`}
									</span>
								</div>
							)}

							{!dayCard && (
								<div className="text-[0.78rem] text-[var(--c-muted)] mt-1 space-y-1">
									<div>{formatFrequency(habit)}</div>
									{isFinished && (
										<div className="text-[var(--c-muted)]">
											{wasQuit ? 'Quit' : 'Finished'} {formatDateTitle(new Date(habit.endDate))}
										</div>
									)}
									{streaks.days && <StreakRow label="Days" streak={streaks.days} unit="day" />}
									<StreakRow label="Weeks" streak={streaks.weeks} unit="week" />
								</div>
							)}
						</>
					)}
				</div>

				<div className="flex flex-col items-end gap-2 shrink-0">
					<div
						className="flex items-center gap-1.5 text-[var(--c-accent)]"
						title={streaks.days ? 'Day streak' : 'Consecutive weeks on target'}
					>
						<Icon icon="fire" color="var(--c-accent)" size="sm" scale={iconScale} />
						<span className="text-display-sm text-[1.05rem] numerals">{headlineStreak}</span>
					</div>

					{!dayCard && !isEditing && (
						<ButtonComponent onClick={() => setIsEditing(true)} variant="secondary" size="sm">
							Edit
						</ButtonComponent>
					)}
				</div>
			</div>

			{isEditing && <HabitEditPanel habit={habit} onClose={() => setIsEditing(false)} />}
		</div>
	);
}
