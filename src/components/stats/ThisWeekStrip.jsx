import { progressColor } from '../../utils/progressColor';
import { getLocalDateKey, isSameDay } from '../../utils/dateHelpers';

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * The seven days you are actually in, shaded by how much of each got done —
 * the same scale as the calendar, so a day looks the same wherever you meet it.
 */
export default function ThisWeekStrip({ days, progress, today }) {
	return (
		<section>
			<h2 className="text-eyebrow mb-2">This week</h2>

			<div className="grid grid-cols-7 gap-1.5">
				{days.map((date, i) => {
					const dayProgress = progress.get(getLocalDateKey(date));
					const isToday = isSameDay(date, today);
					const isFuture = dayProgress.state === 'future';
					const empty = dayProgress.total === 0;

					return (
						<div key={getLocalDateKey(date)} className="flex flex-col items-center gap-1">
							<div
								title={
									empty
										? 'nothing scheduled'
										: `${dayProgress.done} of ${dayProgress.total}`
								}
								className={`w-full aspect-square rounded-[10px] grid place-items-center
									text-[0.7rem] numerals
									${isToday ? 'border-2 border-[var(--c-text)] font-bold' : 'border border-[var(--c-border)]'}`}
								style={{
									background:
										isFuture || empty
											? 'var(--c-surface)'
											: progressColor(dayProgress.ratio),
									color: 'var(--c-text-soft)',
								}}
							>
								{date.getDate()}
							</div>
							<span className="text-[0.65rem] text-[var(--c-muted)]">{LABELS[i]}</span>
						</div>
					);
				})}
			</div>
		</section>
	);
}
