import { useState } from 'react';
import {
	useUpdateHabit,
	usePauseHabit,
	useResumeHabit,
	useEndHabit,
	useReopenHabit,
	useDeleteHabit,
} from '../hooks/useHabitMutations';
import ButtonComponent from './elements/ButtonComponent';
import Icon from './icons/Icon';
import { FREQUENCY, END_REASON, isPausedNow } from '../services/schedule';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * A quarter of the control row: icon over a short label.
 *
 * These were five text buttons of equal weight sitting next to Save and
 * Cancel, which made every option look equally likely. Icons alone were
 * compact but left Finish and Quit hard to tell apart on a phone — a word each
 * fixes that without the row growing.
 *
 * `hint` carries the longer explanation for hover and screen readers.
 */
function IconAction({ icon, label, hint, onClick, tone = 'default' }) {
	const tones = {
		default:
			'text-[var(--c-text-soft)] border-[var(--c-border)] hover:bg-[var(--c-surface-sunk)]',
		danger:
			'text-[var(--c-danger)] border-[color-mix(in_srgb,var(--c-danger)_35%,transparent)] hover:bg-[var(--c-danger-soft)]',
	};

	return (
		<button
			type="button"
			onClick={onClick}
			title={hint || label}
			aria-label={hint || label}
			className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2
				rounded-[var(--radius-sm)] border bg-[var(--c-surface)]
				transition-colors duration-[var(--dur-quick)] active:scale-95 ${tones[tone]}`}
		>
			<Icon icon={icon} size="sm" />
			<span className="text-[0.65rem] font-semibold leading-none">{label}</span>
		</button>
	);
}

export default function HabitEditPanel({ habit, onClose }) {
	const updateMutation = useUpdateHabit();
	const pauseMutation = usePauseHabit();
	const resumeMutation = useResumeHabit();
	const endMutation = useEndHabit();
	const reopenMutation = useReopenHabit();
	const deleteMutation = useDeleteHabit();

	const [details, setDetails] = useState(habit.details || '');
	const [frequency, setFrequency] = useState(habit.frequency);
	const [daysOfWeek, setDaysOfWeek] = useState(habit.daysOfWeek || []);
	const [timesPerPeriod, setTimesPerPeriod] = useState(habit.timesPerPeriod || '');
	const [error, setError] = useState(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const isPaused = isPausedNow(habit);
	const isFinished = habit.endDate != null;

	const run = async (mutation, args) => {
		await mutation.mutateAsync(args);
		onClose();
	};

	const handleSave = () => {
		if (frequency === FREQUENCY.SPECIFIC_DAYS && daysOfWeek.length === 0) {
			setError('Pick at least one day, or this habit will not show up anywhere.');
			return;
		}
		setError(null);

		return run(updateMutation, {
			id: habit.id,
			updates: {
				details,
				frequency,
				daysOfWeek: frequency === FREQUENCY.SPECIFIC_DAYS ? daysOfWeek : null,
				timesPerPeriod:
					frequency === FREQUENCY.WEEKLY ? Number(timesPerPeriod) || 1 : null,
			},
		});
	};

	const toggleDay = day =>
		setDaysOfWeek(prev =>
			prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
		);

	return (
		<div className="mt-3 space-y-4">
			{/* Lifecycle first, straight under the card's own summary, so the form
			    below is only ever about the habit's settings. */}
			<div className="pb-4 border-b border-[var(--c-border)]">
				{confirmingDelete ? (
					<div className="space-y-2">
						<p className="text-sm text-[var(--c-danger)]">
							Erase this habit and its whole history? This cannot be undone.
						</p>
						<div className="flex gap-2">
							<ButtonComponent
								onClick={() => deleteMutation.mutateAsync({ id: habit.id })}
								variant="danger"
								size="sm"
							>
								Delete forever
							</ButtonComponent>
							<ButtonComponent
								onClick={() => setConfirmingDelete(false)}
								variant="secondary"
								size="sm"
							>
								Keep it
							</ButtonComponent>
						</div>
					</div>
				) : (
					<div className="flex items-center gap-2">
						{!isFinished &&
							(isPaused ? (
								<IconAction
									icon="play"
									label="Resume"
									hint="Start counting this habit again"
									onClick={() => run(resumeMutation, { id: habit.id })}
								/>
							) : (
								<IconAction
									icon="pause"
									label="Pause"
									hint="Pause — paused days are not counted as misses"
									onClick={() => run(pauseMutation, { id: habit.id })}
								/>
							))}

						{!isFinished && (
							<>
								<IconAction
									icon="check-circle"
									label="Finish"
									hint="Mark finished — streaks are kept and frozen"
									onClick={() =>
										run(endMutation, { id: habit.id, reason: END_REASON.COMPLETED })
									}
								/>
								<IconAction
									icon="x-circle"
									label="Quit"
									hint="Quit — streaks are kept and frozen"
									onClick={() => run(endMutation, { id: habit.id, reason: END_REASON.QUIT })}
								/>
							</>
						)}

						{isFinished && (
							<IconAction
								icon="arrow-path"
								label="Restart"
								hint="Pick it back up and move it to your active habits"
								onClick={() => run(reopenMutation, { id: habit.id })}
							/>
						)}

						<IconAction
							icon="trash"
							label="Delete"
							hint="Delete this habit and everything recorded against it"
							tone="danger"
							onClick={() => setConfirmingDelete(true)}
						/>
					</div>
				)}
			</div>

			<div className="space-y-4">
				<label className="block">
					<span className="form-label">Details</span>
					<textarea
						rows="2"
						className="form-input resize-none"
						value={details}
						onChange={e => setDetails(e.target.value)}
						placeholder="What does doing this well look like?"
					/>
				</label>

				<label className="block">
					<span className="form-label">Frequency</span>
					<select
						className="form-input"
						value={frequency}
						onChange={e => setFrequency(e.target.value)}
					>
						<option value={FREQUENCY.DAILY}>Every day</option>
						<option value={FREQUENCY.SPECIFIC_DAYS}>On specific days</option>
						<option value={FREQUENCY.WEEKLY}>A number of times a week</option>
					</select>
				</label>

				{frequency === FREQUENCY.SPECIFIC_DAYS && (
					<div>
						<span className="form-label">Days</span>
						<div className="flex flex-wrap gap-1.5">
							{DAY_NAMES.map((label, day) => (
								<button
									key={day}
									type="button"
									aria-pressed={daysOfWeek.includes(day)}
									onClick={() => toggleDay(day)}
									className={`min-w-[38px] min-h-[38px] px-2 rounded-[var(--radius-sm)] border
										text-xs font-semibold transition-colors duration-[var(--dur-quick)]
										${
											daysOfWeek.includes(day)
												? 'bg-[var(--c-text)] text-white border-[var(--c-text)]'
												: 'bg-[var(--c-surface)] text-[var(--c-text-soft)] border-[var(--c-border)]'
										}`}
								>
									{label}
								</button>
							))}
						</div>
					</div>
				)}

				{frequency === FREQUENCY.WEEKLY && (
					<label className="block">
						<span className="form-label">Times per week</span>
						<input
							type="number"
							min="1"
							max="7"
							className="form-input"
							value={timesPerPeriod}
							onChange={e => setTimesPerPeriod(e.target.value)}
						/>
					</label>
				)}

				{error && <p className="text-sm text-[var(--c-danger)]">{error}</p>}
			</div>

			<div className="flex gap-2 pt-3 border-t border-[var(--c-border)]">
				<div className="flex-1">
					<ButtonComponent onClick={handleSave} variant="primary" size="sm" fullWidth>
						Save
					</ButtonComponent>
				</div>
				<div className="flex-1">
					<ButtonComponent onClick={onClose} variant="secondary" size="sm" fullWidth>
						Cancel
					</ButtonComponent>
				</div>
			</div>
		</div>
	);
}
