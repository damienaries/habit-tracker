import { useMemo, useState } from 'react';
import { getLocalDateKey, generateDateOffset } from '../../utils/dateHelpers';
import { isExpectedOn, FREQUENCY } from '../../services/schedule';
import { getHabitScore } from '../../services/stats';
import { calculateStreaks } from '../../services/streaks';
import { progressColor } from '../../utils/progressColor';
import Icon from '../icons/Icon';
import HabitEditPanel from '../HabitEditPanel';

const RECENT_DAYS = 21;

// The last three weeks at a glance: a filled square for a day done, a hollow
// one for a day owed and missed, and nothing at all for a day never asked for.
function RecentStrip({ habit, today }) {
	const days = useMemo(() => {
		const completions = new Set(habit.completions || []);

		return Array.from({ length: RECENT_DAYS }, (_, i) => {
			const date = generateDateOffset(today, -(RECENT_DAYS - 1 - i));
			const key = getLocalDateKey(date);

			return {
				key,
				done: completions.has(key),
				// A flexible habit owes no particular day, so nothing is ever a miss.
				owed: habit.frequency === FREQUENCY.WEEKLY ? false : isExpectedOn(habit, date),
			};
		});
	}, [habit, today]);

	return (
		<div className="flex gap-[3px]" role="img" aria-label="Last three weeks">
			{days.map(({ key, done, owed }) => (
				<span
					key={key}
					className="flex-1 h-[18px] rounded-[3px] border"
					style={{
						background: done ? 'var(--c-done)' : owed ? 'var(--c-idle)' : 'transparent',
						borderColor: done ? 'var(--c-done)' : 'var(--c-border)',
					}}
				/>
			))}
		</div>
	);
}

export default function HabitStatRow({ habit, today, hue, subtitle }) {
	const [isEditing, setIsEditing] = useState(false);
	const score = useMemo(() => getHabitScore(habit, today), [habit, today]);
	const streaks = useMemo(() => calculateStreaks(habit, today), [habit, today]);
	const streak = streaks.days ? streaks.days.current : streaks.weeks.current;

	return (
		<article className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--c-border)] bg-[var(--c-surface)] p-3.5">
			<span
				aria-hidden="true"
				className="absolute left-0 inset-y-0 w-[3px]"
				style={{ background: hue }}
			/>

			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="font-semibold capitalize leading-snug truncate">{habit.name}</h3>
					<p className="text-[0.75rem] text-[var(--c-muted)] numerals mt-0.5">
						{subtitle} · {score.daysTracked} day{score.daysTracked === 1 ? '' : 's'}
					</p>
				</div>

				<div className="text-right shrink-0">
					<p
						className="text-display text-[1.5rem] leading-none numerals"
						style={{ color: score.ratio === null ? 'var(--c-muted)' : progressColor(score.ratio) }}
					>
						{score.ratio === null ? '—' : `${Math.round(score.ratio * 100)}%`}
					</p>
					<p className="text-[0.62rem] uppercase tracking-wider text-[var(--c-muted)] mt-0.5">
						{score.ratio === null ? 'new' : 'on target'}
					</p>
				</div>
			</div>

			<div className="mt-3">
				<RecentStrip habit={habit} today={today} />
			</div>

			<div className="flex items-center justify-between mt-2">
				<span className="text-[0.7rem] text-[var(--c-muted)] numerals">
					{score.totalDone} done all time
				</span>

				<span className="flex items-center gap-2">
					<span className="flex items-center gap-1 text-[var(--c-accent)]">
						<Icon icon="fire" color="var(--c-accent)" size="sm" />
						<span className="text-display-sm text-[0.95rem] numerals">{streak}</span>
					</span>

					<button
						type="button"
						onClick={() => setIsEditing(v => !v)}
						aria-label={`Edit ${habit.name}`}
						aria-expanded={isEditing}
						title="Edit"
						className="grid place-items-center w-9 h-9 -mr-1 rounded-full text-[var(--c-muted)] transition-colors hover:bg-[var(--c-surface-sunk)]"
					>
						<Icon icon="pencil" size="sm" />
					</button>
				</span>
			</div>

			{isEditing && <HabitEditPanel habit={habit} onClose={() => setIsEditing(false)} />}
		</article>
	);
}
