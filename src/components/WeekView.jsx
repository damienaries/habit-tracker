import { isSameDay, getLocalDateKey } from '../utils/dateHelpers';
import { progressColor } from '../utils/progressColor';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * One bullet per thing planned that day: filled once it is done, hollow until
 * then. Errands are squared off so they read apart from habits at a glance.
 */
function Bullets({ items }) {
	return (
		<span
			className="flex flex-wrap items-center gap-1.5"
			aria-label={`${items.filter(i => i.done).length} of ${items.length} done`}
		>
			{items.map(item => (
				<span
					key={item.id}
					title={item.label}
					className={`w-[9px] h-[9px] border-2 transition-colors duration-[var(--dur-base)]
						${item.kind === 'todo' ? 'rounded-[3px]' : 'rounded-full'}
						${item.done ? '' : 'bg-transparent border-[var(--c-border-strong)]'}`}
					style={
						item.done
							? { background: 'var(--c-done)', borderColor: 'var(--c-done)' }
							: undefined
					}
				/>
			))}
		</span>
	);
}

/**
 * A week as seven rows rather than seven squares.
 *
 * A month has to compress a day into a tinted cell because thirty of them must
 * fit. A week does not, so each day gets its own bullets, the errands named,
 * and a border drawn round as much of the card as the day got done.
 */
export default function WeekView({ days, progress, itemsByDate, todosByDate, today, onOpenDate }) {
	return (
		<div className="flex flex-col gap-2">
			{days.map(date => {
				const key = getLocalDateKey(date);
				const dayProgress = progress.get(key);
				const items = itemsByDate.get(key) || [];
				const dayTodos = todosByDate.get(key) || [];
				const isToday = isSameDay(date, today);
				const isFuture = dayProgress.state === 'future';
				const fill = isFuture ? 0 : Math.round(dayProgress.ratio * 100);

				return (
					<button
						key={key}
						type="button"
						onClick={() => onOpenDate(date)}
						className={`relative w-full text-left rounded-[var(--radius)] border p-3
							bg-[var(--c-surface)] transition-colors duration-[var(--dur-quick)]
							active:scale-[0.99]
							${isToday ? 'border-[var(--c-text)] border-2' : 'border-[var(--c-border)]'}`}
					>
						{/* The completed share of the day, drawn as the card's own edge. */}
						{fill > 0 && (
							<svg className="day-ring" aria-hidden="true">
								<rect
									pathLength="100"
									strokeDasharray={`${fill} 100`}
									style={{ stroke: progressColor(dayProgress.ratio) }}
								/>
							</svg>
						)}

						<div className="flex items-baseline justify-between gap-3">
							<span className="flex items-baseline gap-2 min-w-0">
								<span className="text-display-sm text-[0.95rem]">{DAY_NAMES[date.getDay()]}</span>
								<span className="text-[0.8rem] text-[var(--c-muted)] numerals">
									{date.getDate()}
								</span>
								{isToday && (
									<span className="text-[0.62rem] uppercase tracking-wider text-[var(--c-accent)] font-semibold">
										Today
									</span>
								)}
							</span>

							{items.length > 0 && <Bullets items={items} />}
						</div>

						{items.length === 0 && (
							<p className="text-[0.75rem] text-[var(--c-muted)] mt-1">Nothing on</p>
						)}

						{dayTodos.length > 0 && (
							<ul className="mt-2 flex flex-col gap-1">
								{dayTodos.map(todo => (
									<li
										key={todo.id}
										className={`flex items-baseline gap-2 text-[0.8rem] ${
											todo.completedOn ? 'text-[var(--c-muted)] line-through' : ''
										}`}
									>
										<span
											aria-hidden="true"
											className="w-1.5 h-1.5 rounded-[2px] shrink-0 translate-y-[-2px]"
											style={{
												background: todo.completedOn ? 'var(--c-done)' : 'var(--c-accent)',
											}}
										/>
										<span className="min-w-0 truncate">{todo.title}</span>
									</li>
								))}
							</ul>
						)}
					</button>
				);
			})}
		</div>
	);
}
