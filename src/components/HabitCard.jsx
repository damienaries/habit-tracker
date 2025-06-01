import { isSameDay } from '../utils/dateHelpers';
import HabitCheckbox from './HabitCheckbox';
import Icon from './icons/Icon';
import { useState } from 'react';
import { updateHabit } from '../services/habitService';
import ButtonComponent from './elements/ButtonComponent';
import { formatDateTitle } from '../utils/dateHelpers';

export default function HabitCard({ habit, date, dayCard = true }) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedDetails, setEditedDetails] = useState(habit.details || '');
	const [editedFrequency, setEditedFrequency] = useState(habit.frequency);
	const [editedTimesPerPeriod, setEditedTimesPerPeriod] = useState(habit.timesPerPeriod || '');

	const isWeeklyHabit = habit.frequency === 'weekly' && habit.timesPerPeriod;
	const isTerminated = habit.endDate != null;

	// Use completions array for done state
	let completions = [];
	if (isWeeklyHabit) {
		completions = Array.isArray(habit.weeklyCompletions) ? habit.weeklyCompletions : [];
	} else {
		completions = Array.isArray(habit.completedDates) ? habit.completedDates : [];
	}
	const alreadyDone = completions.some(d => isSameDay(new Date(d), date));

	const iconScale = 1 + Math.floor(habit.streak / 5) * 0.25;

	// Get weekly completions if it's a weekly habit
	const getWeeklyProgress = () => {
		if (!isWeeklyHabit) return null;

		// Get start of week (Monday)
		const today = new Date(date);
		const day = today.getDay();
		const diff = today.getDate() - day + (day === 0 ? -6 : 1);
		const weekStart = new Date(today.setDate(diff));
		weekStart.setHours(0, 0, 0, 0);

		// Get end of week (Sunday)
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekEnd.getDate() + 7);

		// Filter completions for current week
		const weeklyCompletions = (habit.weeklyCompletions || []).filter(completion => {
			const completionDate = new Date(completion);
			return completionDate >= weekStart && completionDate < weekEnd;
		});

		return {
			completed: weeklyCompletions.length,
			total: habit.timesPerPeriod,
			remaining: habit.timesPerPeriod - weeklyCompletions.length,
			isWeekComplete: weeklyCompletions.length >= habit.timesPerPeriod,
		};
	};

	const weeklyProgress = getWeeklyProgress();

	const handleSave = async () => {
		await updateHabit(habit.id, {
			details: editedDetails,
			frequency: editedFrequency,
			timesPerPeriod:
				editedFrequency === 'weekly' || editedFrequency === 'monthly'
					? Number(editedTimesPerPeriod)
					: null,
		});
		setIsEditing(false);
	};

	const handleTerminate = async () => {
		const today = new Date();
		await updateHabit(habit.id, {
			endDate: today.toISOString(),
		});
		setIsEditing(false);
	};

	return (
		<div
			key={habit.id}
			className={`p-3 rounded-md w-full flex items-start gap-3 transition-colors duration-200
				${alreadyDone ? 'bg-green-50' : 'bg-gray-50'}
				${weeklyProgress?.isWeekComplete ? 'opacity-75' : 'opacity-100'}
			`}
		>
			{dayCard && <HabitCheckbox habit={habit} date={date} />}

			<div className="flex-1">
				<div className="font-medium capitalize">{habit.name}</div>

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
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
						{(editedFrequency === 'weekly' || editedFrequency === 'monthly') && (
							<div>
								<label className="text-xs text-gray-500">Times per {editedFrequency}:</label>
								<input
									type="number"
									value={editedTimesPerPeriod}
									onChange={e => setEditedTimesPerPeriod(e.target.value)}
									className="w-full p-1 text-sm border rounded"
									min="1"
									max={editedFrequency === 'weekly' ? '7' : '31'}
								/>
							</div>
						)}
						<div className="flex justify-between items-center mt-2">
							<div className="flex gap-2">
								<ButtonComponent onClick={handleSave} variant="primary" size="sm">
									Save
								</ButtonComponent>
								<ButtonComponent onClick={() => setIsEditing(false)} variant="secondary" size="sm">
									Cancel
								</ButtonComponent>
							</div>
							{!isTerminated ? (
								<ButtonComponent onClick={handleTerminate} variant="danger" size="sm">
									Terminate
								</ButtonComponent>
							) : (
								<p>Habit completed on: {formatDateTitle(new Date(habit.endDate))}</p>
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
							<div className="text-xs text-gray-500 mt-1">
								Frequency: {habit.frequency}
								{habit.timesPerPeriod ? ` (${habit.timesPerPeriod}× per ${habit.frequency})` : ''}
							</div>
						)}
					</>
				)}
			</div>

			<div className="flex flex-col items-end gap-2">
				<div className="text-xs text-gray-500 flex items-center gap-1">
					<Icon icon="fire" color="#f97316" size="sm" scale={iconScale} />
					{habit.streak}
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
