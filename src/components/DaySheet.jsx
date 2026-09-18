import { formatDateTitle, isSameDay, getStartOfToday } from '../utils/dateHelpers';
import Icon from './icons/Icon';
import DayHabits from './DayHabits';
import TodoList from './TodoList';

// Opening a day is the whole affordance for correcting it — no timed reveal, no
// separate edit mode. If the day is open, its habits can be checked off.
export default function DaySheet({ date, onClose }) {
	const isToday = date ? isSameDay(date, new Date()) : false;
	const isFuture = date ? date > getStartOfToday() && !isToday : false;

	return (
		<>
			<div
				className={`fixed inset-0 bg-[var(--c-text)]/25 transition-opacity duration-[var(--dur-base)] z-40 ${
					date ? 'opacity-100' : 'opacity-0 pointer-events-none'
				}`}
				onClick={onClose}
			/>

			<div
				className={`fixed z-50 inset-x-0 bottom-0 max-h-[80vh] bg-[var(--c-bg)] rounded-t-[var(--radius-lg)] shadow-2xl
					transform transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]
					${date ? 'translate-y-0' : 'translate-y-full'}`}
				role="dialog"
				aria-modal="true"
				aria-label={date ? formatDateTitle(date) : 'Day details'}
			>
				<div className="flex flex-col max-h-[80vh]">
					<div className="p-4 border-b border-[var(--c-border)] flex items-center justify-between">
						<div>
							<h2 className="text-display-sm text-[1.15rem]">
								{date ? formatDateTitle(date) : ''}
							</h2>
							{date && !isToday && (
								<p className="text-xs text-[var(--c-muted)] mt-0.5">
									{isFuture
										? 'A look ahead — nothing to tick yet'
										: 'Check off anything you forgot'}
								</p>
							)}
						</div>
						<button
							onClick={onClose}
							className="w-9 h-9 -mr-2 grid place-items-center rounded-full text-[var(--c-muted)] transition-colors hover:bg-[var(--c-surface-sunk)]"
							aria-label="Close"
						>
							<Icon icon="x" size="lg" />
						</button>
					</div>

					<div
						className="flex-1 overflow-y-auto p-4"
						style={{ paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
					>
						{date && (
							<>
								<TodoList date={date} editable={!isFuture} />
								<DayHabits
									date={date}
									editable={!isFuture}
									emptyMessage={isFuture ? 'Nothing planned yet.' : 'Nothing was scheduled.'}
								/>
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
