import { formatDateTitle, isSameDay } from '../utils/dateHelpers';
import Icon from './icons/Icon';
import ButtonComponent from './elements/ButtonComponent';
import DayHabits from './DayHabits';

// Opening a day is the whole affordance for correcting it — no timed reveal, no
// separate edit mode. If the day is open, its habits can be checked off.
export default function DaySheet({ date, onClose }) {
	const isToday = date ? isSameDay(date, new Date()) : false;

	return (
		<>
			<div
				className={`fixed inset-0 bg-black/30 transition-opacity duration-200 z-40 ${
					date ? 'opacity-100' : 'opacity-0 pointer-events-none'
				}`}
				onClick={onClose}
			/>

			<div
				className={`fixed z-50 inset-x-0 bottom-0 max-h-[80vh] bg-white rounded-t-2xl shadow-xl
					transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
					${date ? 'translate-y-0' : 'translate-y-full'}`}
				role="dialog"
				aria-modal="true"
				aria-label={date ? formatDateTitle(date) : 'Day details'}
			>
				<div className="flex flex-col max-h-[80vh]">
					<div className="p-4 border-b flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold">{date ? formatDateTitle(date) : ''}</h2>
							{!isToday && date && (
								<p className="text-xs text-gray-500">Check off anything you forgot</p>
							)}
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-full transition-colors"
							aria-label="Close"
						>
							<Icon icon="x" size="lg" />
						</button>
					</div>

					<div className="flex-1 overflow-y-auto p-4">
						{date && <DayHabits date={date} editable emptyMessage="Nothing was scheduled." />}
					</div>

					<div className="p-4 border-t">
						<ButtonComponent onClick={onClose} variant="primary" fullWidth>
							Done
						</ButtonComponent>
					</div>
				</div>
			</div>
		</>
	);
}
