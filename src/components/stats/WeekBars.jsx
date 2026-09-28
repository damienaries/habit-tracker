import { progressColor } from '../../utils/progressColor';

/**
 * One bar per week. The week you are standing in is dashed rather than filled,
 * so a week only half elapsed does not read as a week half failed.
 */
export default function WeekBars({ history }) {
	if (!history.some(week => week.planned > 0)) return null;

	return (
		<section>
			<h2 className="text-eyebrow mb-2">Last {history.length} weeks</h2>

			<div
				className="relative flex items-end gap-1.5 h-24"
				role="img"
				aria-label="Weekly completion history"
			>
				{/* 100% and 50%, so a bar can be read as a value on its own. */}
				<span
					aria-hidden="true"
					className="absolute inset-x-0 top-0 border-t border-dashed border-[var(--c-border-strong)]"
				/>
				<span
					aria-hidden="true"
					className="absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--c-border)]"
				/>
				{history.map(week => (
					<div key={week.key} className="flex-1 flex flex-col justify-end h-full">
						<div
							title={
								week.planned === 0
									? 'nothing planned'
									: `${Math.round(week.ratio * 100)}% — ${week.done} of ${week.planned}`
							}
							className="rounded-t-[4px] transition-[height] duration-[var(--dur-slow)] ease-[var(--ease-out)]"
							style={{
								height: week.planned === 0 ? '3px' : `${Math.max(week.ratio * 100, 4)}%`,
								background: week.planned === 0 ? 'var(--c-idle)' : progressColor(week.ratio),
								opacity: week.inProgress ? 0.5 : 1,
								outline: week.inProgress ? '2px dashed var(--c-border-strong)' : 'none',
								outlineOffset: '-2px',
							}}
						/>
					</div>
				))}
			</div>

			<div className="flex justify-between mt-1.5 text-[0.62rem] text-[var(--c-muted)]">
				<span>{history.length} weeks ago</span>
				<span className="text-[var(--c-border-strong)]">— 100%</span>
				<span>This week</span>
			</div>
		</section>
	);
}
