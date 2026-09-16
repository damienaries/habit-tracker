import { useState } from 'react';
import { useCreateHabit } from '../hooks/useHabitMutations';
import { FREQUENCY } from '../services/schedule';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_PRESETS = [
	{ label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
	{ label: 'Weekdays', days: [1, 2, 3, 4, 5] },
	{ label: 'Weekends', days: [6, 0] },
];

const sameDays = (a, b) => a.length === b.length && [...a].sort().every((d, i) => d === [...b].sort()[i]);
import ButtonComponent from './elements/ButtonComponent';
import { normalizeDate } from '../db/habitDb';
import { useUser } from '../contexts/UserContext';

export default function HabitForm({ onCreate }) {
	const { user } = useUser();
	const createMutation = useCreateHabit();
	const [name, setName] = useState('');
	const [frequency, setFrequency] = useState(FREQUENCY.DAILY);
	const [daysOfWeek, setDaysOfWeek] = useState([]);
	const [timesPerPeriod, setTimesPerPeriod] = useState('');
	const [durationMinutes, setDurationMinutes] = useState('30');
	const [timeOfDay, setTimeOfDay] = useState('');
	const [details, setDetails] = useState('');
	const [startDate, setStartDate] = useState(
		() => normalizeDate(new Date()).toISOString().split('T')[0]
	);
	const [endDate, setEndDate] = useState('');
	const [error, setError] = useState(null);
	const [message, setMessage] = useState(null);

	const validateForm = () => {
		if (!name || !frequency || !startDate) {
			setError('Please fill in all required fields.');
			return false;
		}

		if (frequency === FREQUENCY.SPECIFIC_DAYS && daysOfWeek.length === 0) {
			setError('Pick at least one day of the week.');
			return false;
		}

		if (frequency === FREQUENCY.WEEKLY && (!timesPerPeriod || +timesPerPeriod < 1)) {
			setError('How many times a week? Must be at least 1.');
			return false;
		}

		return true;
	};

	const handleSubmit = async e => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			await createMutation.mutateAsync({
				userId: user.id,
				name,
				frequency,
				startDate: normalizeDate(startDate),
				endDate: endDate ? normalizeDate(endDate) : null,
				details,
				daysOfWeek: frequency === FREQUENCY.SPECIFIC_DAYS ? daysOfWeek : null,
				timesPerPeriod:
					frequency === FREQUENCY.WEEKLY ? parseInt(timesPerPeriod, 10) : null,
				durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
				timeOfDay: timeOfDay || null,
			});

			// reset form
			setName('');
			setFrequency(FREQUENCY.DAILY);
			setDaysOfWeek([]);
			setTimesPerPeriod('');
			setDurationMinutes('30');
			setTimeOfDay('');
			setDetails('');
			setStartDate(normalizeDate(new Date()).toISOString().split('T')[0]);
			setEndDate('');
			setError(null);

			if (onCreate) {
				onCreate(); // allow parent to refresh list or navigate
			}

			setMessage({ type: 'success', text: 'Habit created successfully!' });
			setTimeout(() => {
				setMessage(null);
			}, 3000);
		} catch (e) {
			console.error(e);
			setError('Failed to create habit. Please try again.');
			setMessage({ type: 'error', text: 'Error saving habit' });
			setTimeout(() => {
				setMessage(null);
			}, 3000);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-y-6 w-full my-4 rounded border border-gray-50 p-2"
		>
			{error && <div className="text-red-600 text-sm">{error}</div>}

			{message && (
				<div
					className={`text-sm px-4 py-2 rounded-md ${
						message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
					}`}
				>
					{message.text}
				</div>
			)}

			<label>
				<span className="form-label">Habit Name *</span>
				<input
					type="text"
					className="form-input"
					value={name}
					onChange={e => setName(e.target.value)}
					required
				/>
			</label>

			<label>
				<span className="form-label">Frequency *</span>
				<select
					value={frequency}
					onChange={e => setFrequency(e.target.value)}
					className="form-input"
				>
					<option value={FREQUENCY.DAILY}>Every day</option>
					<option value={FREQUENCY.SPECIFIC_DAYS}>On specific days</option>
					<option value={FREQUENCY.WEEKLY}>A number of times a week</option>
				</select>
			</label>

			{frequency === FREQUENCY.SPECIFIC_DAYS && (
				<div>
					<span className="form-label">Which days? *</span>
					<div className="flex flex-wrap gap-2 mt-1 mb-2">
						{DAY_PRESETS.map(preset => (
							<button
								key={preset.label}
								type="button"
								onClick={() => setDaysOfWeek(preset.days)}
								className={`px-3 py-1 rounded-full border text-xs transition-colors ${
									sameDays(daysOfWeek, preset.days)
										? 'bg-gray-800 text-white border-gray-800'
										: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
								}`}
							>
								{preset.label}
							</button>
						))}
					</div>
					<div className="flex flex-wrap gap-2 mt-1">
						{DAY_NAMES.map((label, day) => (
							<button
								key={day}
								type="button"
								aria-pressed={daysOfWeek.includes(day)}
								onClick={() =>
									setDaysOfWeek(prev =>
										prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
									)
								}
								className={`px-3 py-2 rounded-md border text-sm transition-colors ${
									daysOfWeek.includes(day)
										? 'bg-gray-800 text-white border-gray-800'
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>
			)}

			{frequency === FREQUENCY.WEEKLY && (
				<label>
					<span className="form-label">Times per week *</span>
					<input
						type="number"
						className="form-input"
						min="1"
						max="7"
						value={timesPerPeriod}
						onChange={e => setTimesPerPeriod(e.target.value)}
					/>
				</label>
			)}

			<div className="flex gap-4">
				<label className="flex-1">
					<span className="form-label">How long? (minutes)</span>
					<input
						type="number"
						className="form-input"
						min="1"
						placeholder="30"
						value={durationMinutes}
						onChange={e => setDurationMinutes(e.target.value)}
					/>
				</label>
				<label className="flex-1">
					<span className="form-label">What time?</span>
					<input
						type="time"
						className="form-input"
						value={timeOfDay}
						onChange={e => setTimeOfDay(e.target.value)}
					/>
				</label>
			</div>

			<label>
				<span className="form-label">Details (optional)</span>
				<textarea
					rows="3"
					className="form-input"
					value={details}
					onChange={e => setDetails(e.target.value)}
					placeholder="Describe how achieving this habit will look like."
				/>
			</label>

			<label>
				<span className="form-label">Start Date *</span>
				<input
					type="date"
					className="form-input"
					value={startDate}
					onChange={e => setStartDate(e.target.value)}
				/>
			</label>

			<label>
				<span className="form-label">End Date (optional)</span>
				<input
					type="date"
					className="form-input"
					value={endDate}
					onChange={e => setEndDate(e.target.value)}
				/>
			</label>

			<ButtonComponent disabled={createMutation.isPending}>
				{createMutation.isPending ? 'Saving...' : 'Save Habit'}
			</ButtonComponent>
		</form>
	);
}
