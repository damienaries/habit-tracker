import { getLocalDateKey, isSameDay } from '../utils/dateHelpers';
import { progressColor, readableInk } from '../utils/progressColor';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// A day is shaded by how much of it got done rather than sorted into three
// buckets — one of four and three of four are genuinely different days.
function cellStyle(progress) {
	if (progress.state === 'empty' || progress.state === 'future') {
		return { background: 'var(--c-surface)', color: 'var(--c-muted)' };
	}

	return {
		background: progressColor(progress.ratio),
		color: readableInk(progress.ratio),
	};
}

export default function MonthGrid({ days, progress, today, onOpenDate }) {
	return (
		<>
			<div className="grid grid-cols-7 gap-1.5 mb-1">
				{WEEKDAYS.map((day, i) => (
					<div key={i} className="text-center text-[0.65rem] text-[var(--c-muted)] py-1">
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1.5">
				{days.map(({ date, inMonth }) => {
					const dayProgress = progress.get(getLocalDateKey(date));
					const isToday = isSameDay(date, today);

					return (
						<button
							key={getLocalDateKey(date)}
							type="button"
							onClick={() => onOpenDate(date)}
							aria-label={
								dayProgress.state === 'future'
									? `${date.getDate()} — ${dayProgress.total} planned`
									: dayProgress.total > 0
										? `${date.getDate()} — ${dayProgress.done} of ${dayProgress.total} done`
										: `${date.getDate()} — nothing scheduled`
							}
							style={cellStyle(dayProgress)}
							className={`aspect-square rounded-[10px] text-sm numerals grid place-items-center
								border transition-all duration-[var(--dur-base)] ease-[var(--ease-out)]
								cursor-pointer active:scale-95
								${inMonth ? '' : 'opacity-35'}
								${
									isToday
										? 'border-[var(--c-text)] border-2 font-bold'
										: 'border-[var(--c-border)]'
								}`}
						>
							{date.getDate()}
						</button>
					);
				})}
			</div>

			<div className="flex items-center gap-2 mt-5 justify-center">
				<span className="text-[0.65rem] text-[var(--c-muted)]">None</span>
				<div className="flex gap-1">
					{[0, 0.25, 0.5, 0.75, 1].map(step => (
						<span
							key={step}
							className="w-5 h-5 rounded-md border border-[var(--c-border)]"
							style={{ background: progressColor(step) }}
						/>
					))}
				</div>
				<span className="text-[0.65rem] text-[var(--c-muted)]">All done</span>
			</div>
		</>
	);
}
