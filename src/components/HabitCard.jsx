import { useMemo, useState } from 'react';
import HabitCheckbox from './HabitCheckbox';
import Icon from './icons/Icon';
import {
	useUpdateHabit,
	usePauseHabit,
	useResumeHabit,
	useEndHabit,
	useReopenHabit,
	useDeleteHabit,
} from '../hooks/useHabitMutations';
import ButtonComponent from './elements/ButtonComponent';
import { formatDateTitle, getLocalDateKey, getStartOfWeek } from '../utils/dateHelpers';
import { FREQUENCY, END_REASON, isPausedNow } from '../services/schedule';
import { calculateStreaks } from '../services/streaks';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatFrequency = habit => {
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
};

function StreakRow({ label, streak, unit }) {
	return (
		<div className="flex gap-2">
			<span className="text-gray-600">{label}</span>
			<span>
				{streak.current} {unit}
				{streak.current === 1 ? '' : 's'} now
			</span>
			<span className="text-gray-400">
				best {streak.best} · last {streak.last} · {streak.total} total
			</span>
		</div>
	);
}

function StreakDetail({ streaks }) {
	return (
		<div className="space-y-0.5">
			{streaks.days && <StreakRow label="Days" streak={streaks.days} unit="day" />}
			<StreakRow label="Weeks" streak={streaks.weeks} unit="week" />
		</div>
	);
}

export default function HabitCard({ habit, date, dayCard = true, editing = false }) {
	const updateMutation = useUpdateHabit();
	const pauseMutation = usePauseHabit();
	const resumeMutation = useResumeHabit();
	const endMutation = useEndHabit();
	const reopenMutation = useReopenHabit();
	const deleteMutation = useDeleteHabit();
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [editError, setEditError] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedDetails, setEditedDetails] = useState(habit.details || '');
	const [editedFrequency, setEditedFrequency] = useState(habit.frequency);
	const [editedTimesPerPeriod, setEditedTimesPerPeriod] = useState(habit.timesPerPeriod || '');
	const [editedDays, setEditedDays] = useState(habit.daysOfWeek || []);

	const isWeeklyHabit = habit.frequency === FREQUENCY.WEEKLY;
	const isFinished = habit.endDate != null;
	const wasQuit = habit.endReason === END_REASON.QUIT;
	const isPaused = isPausedNow(habit);

	const completions = useMemo(() => habit.completions || [], [habit.completions]);
	const alreadyDone = completions.includes(getLocalDateKey(date));

	// Derived from history on every read, so correcting a past day is reflected
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

		return {
			completed,
			total,
			remaining: total - completed,
			isWeekComplete: completed >= total,
		};
	}, [isWeeklyHabit, completions, date, habit.timesPerPeriod]);

	const applyUpdates = async updates => {
		await updateMutation.mutateAsync({ id: habit.id, updates });
		setIsEditing(false);
	};

	const handleSave = () => {
		if (editedFrequency === FREQUENCY.SPECIFIC_DAYS && editedDays.length === 0) {
			setEditError('Pick at least one day, or the habit will not show up anywhere.');
			return;
		}
		setEditError(null);

		return applyUpdates({
			details: editedDetails,
			frequency: editedFrequency,
			daysOfWeek: editedFrequency === FREQUENCY.SPECIFIC_DAYS ? editedDays : null,
			timesPerPeriod:
				editedFrequency === FREQUENCY.WEEKLY ? Number(editedTimesPerPeriod) || 1 : null,
		});
	};

	const handleEnd = async reason => {
		await endMutation.mutateAsync({ id: habit.id, reason });
		setIsEditing(false);
	};

	const handleReopen = async () => {
		await reopenMutation.mutateAsync({ id: habit.id });
		setIsEditing(false);
	};

	const handleDelete = () => deleteMutation.mutateAsync({ id: habit.id });

	const handlePause = async () => {
		await pauseMutation.mutateAsync({ id: habit.id });
		setIsEditing(false);
	};

	const handleUnpause = async () => {
		await resumeMutation.mutateAsync({ id: habit.id });
		setIsEditing(false);
	};

	return (
		<div
			key={habit.id}
			className={`p-3 rounded-md w-full flex items-start gap-3 transition-colors duration-200
				${dayCard ? (alreadyDone ? 'bg-green-50' : 'bg-gray-50') : ''}
				${weeklyProgress?.isWeekComplete ? 'opacity-75' : 'opacity-100'}
				${isPaused ? 'opacity-50 bg-gray-100' : ''}
			`}
		>
			{dayCard && <HabitCheckbox habit={habit} date={date} editing={editing} />}

			<div className="flex-1">
				<div className="font-medium capitalize flex items-center gap-2">
					{habit.name}
					{isPaused && (
						<span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Paused</span>
					)}
					{isFinished && (
						<span
							className={`text-xs px-2 py-1 rounded ${
								wasQuit ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'
							}`}
						>
							{wasQuit ? 'Quit' : 'Finished'}
						</span>
					)}
				</div>

				{/* todo split into component */}
				{isEditing ? (
					<div className="mt-2 space-y-2">
						<div>
							<label className="text-xs text-gray-500">Details:</label>
							<input
								type="text"
								value={editedDetails}
								onChange={e => setEditedDetails(e.target.value)}
								className="w-full p-1 text-sm border rounded"
							/>
						</div>
						<div>
							<label className="text-xs text-gray-500">Frequency:</label>
							<select
								value={editedFrequency}
								onChange={e => setEditedFrequency(e.target.value)}
								className="w-full p-1 text-sm border rounded"
							>
								<option value={FREQUENCY.DAILY}>Every day</option>
								<option value={FREQUENCY.SPECIFIC_DAYS}>On specific days</option>
								<option value={FREQUENCY.WEEKLY}>A number of times a week</option>
							</select>
						</div>
						{editedFrequency === FREQUENCY.SPECIFIC_DAYS && (
							<div>
								<label className="text-xs text-gray-500">Days:</label>
								<div className="flex gap-1 mt-1">
									{DAY_NAMES.map((label, day) => (
										<button
											key={day}
											type="button"
											onClick={() =>
												setEditedDays(prev =>
													prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
												)
											}
											className={`text-xs px-2 py-1 rounded border transition-colors ${
												editedDays.includes(day)
													? 'bg-gray-800 text-white border-gray-800'
													: 'bg-white text-gray-600 border-gray-300'
											}`}
										>
											{label}
										</button>
									))}
								</div>
							</div>
						)}
						{editedFrequency === FREQUENCY.WEEKLY && (
							<div>
								<label className="text-xs text-gray-500">Times per week:</label>
								<input
									type="number"
									value={editedTimesPerPeriod}
									onChange={e => setEditedTimesPerPeriod(e.target.value)}
									className="w-full p-1 text-sm border rounded"
									min="1"
									max="7"
								/>
							</div>
						)}
						{editError && <p className="text-xs text-red-700">{editError}</p>}

						<div className="flex flex-wrap justify-between items-center gap-2 mt-2">
							<div className="flex gap-2">
								<ButtonComponent onClick={handleSave} variant="primary" size="sm">
									Save
								</ButtonComponent>
								<ButtonComponent onClick={() => setIsEditing(false)} variant="secondary" size="sm">
									Cancel
								</ButtonComponent>
							</div>
							{!isFinished ? (
								<div className="flex gap-2">
									{isPaused ? (
										<ButtonComponent onClick={handleUnpause} variant="success" size="sm">
											Resume
										</ButtonComponent>
									) : (
										<ButtonComponent onClick={handlePause} variant="warning" size="sm">
											Pause
										</ButtonComponent>
									)}
									<ButtonComponent
										onClick={() => handleEnd(END_REASON.COMPLETED)}
										variant="success"
										size="sm"
									>
										Mark finished
									</ButtonComponent>
									<ButtonComponent
										onClick={() => handleEnd(END_REASON.QUIT)}
										variant="secondary"
										size="sm"
									>
										Quit
									</ButtonComponent>
								</div>
							) : (
								<ButtonComponent onClick={handleReopen} variant="secondary" size="sm">
									Pick it back up
								</ButtonComponent>
							)}
						</div>

						<div className="pt-2 mt-2 border-t border-gray-200">
							{confirmingDelete ? (
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-xs text-red-700">
										Erase this habit and its whole history? This cannot be undone.
									</span>
									<ButtonComponent onClick={handleDelete} variant="danger" size="sm">
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
							) : (
								<button
									onClick={() => setConfirmingDelete(true)}
									className="text-xs text-gray-400 hover:text-red-700 transition-colors"
								>
									Delete habit
								</button>
							)}
						</div>
					</div>
				) : (
					<>
						{habit.details && dayCard && (
							<div className="text-xs text-gray-500">{habit.details}</div>
						)}
						{isWeeklyHabit && dayCard && (
							<div className="text-xs text-gray-500 mt-1">
								{weeklyProgress.completed}/{weeklyProgress.total} this week
								{weeklyProgress.remaining > 0
									? ` (${weeklyProgress.remaining} more to go)`
									: ' (completed for this week)!'}
							</div>
						)}
						{!dayCard && (
							<div className="text-xs text-gray-500 mt-1 space-y-1">
								<div>{formatFrequency(habit)}</div>
								{isFinished && (
									<div className="text-gray-400">
										{wasQuit ? 'Quit' : 'Finished'} {formatDateTitle(new Date(habit.endDate))}
									</div>
								)}
								<StreakDetail streaks={streaks} />
							</div>
						)}
					</>
				)}
			</div>

			<div className="flex flex-col items-end gap-2">
				<div
					className="text-xs text-gray-500 flex items-center gap-2"
					title={streaks.days ? 'Day streak' : 'Week streak'}
				>
					<Icon icon="fire" color="#f97316" size="sm" scale={iconScale} />
					{headlineStreak}
				</div>
				{!dayCard && !isEditing && (
					<ButtonComponent onClick={() => setIsEditing(true)} variant="secondary" size="sm">
						Details
					</ButtonComponent>
				)}
			</div>
		</div>
	);
}
