import { useState } from 'react';
import { createHabit } from '../services/habitService';
import ButtonComponent from './elements/ButtonComponent';
import { normalizeDate } from '../db/habitDb';
import { useUser } from '../contexts/UserContext';

export default function HabitForm({ onCreate }) {
	const { user } = useUser();
	const [name, setName] = useState('');
	const [frequency, setFrequency] = useState('daily');
	const [customInterval, setCustomInterval] = useState('');
	const [timesPerPeriod, setTimesPerPeriod] = useState('');
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

		if (frequency === 'every_n_days' && (!customInterval || +customInterval < 1)) {
			setError('Please enter a valid interval, must be at least 1');
			return false;
		}

		if (
			(frequency === 'weekly' || frequency === 'monthly') &&
			timesPerPeriod &&
			+timesPerPeriod < 1
		) {
			setError('Times per period must be at least 1.');
			return false;
		}

		return true;
	};

	const handleSubmit = async e => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			await createHabit({
				userId: user.id,
				name,
				frequency,
				startDate: normalizeDate(startDate),
				endDate: endDate ? normalizeDate(endDate) : null,
				details,
				customInterval: frequency === 'every_n_days' ? parseInt(customInterval, 10) : null,
				timesPerPeriod:
					(frequency === 'weekly' || frequency === 'monthly') && timesPerPeriod
						? parseInt(timesPerPeriod, 10)
						: null,
			});

			// reset form
			setName('');
			setFrequency('daily');
			setCustomInterval('');
			setTimesPerPeriod('');
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
					<option value="daily">Daily</option>
					<option value="weekly">Weekly</option>
					<option value="monthly">Monthly</option>
					<option value="every_n_days">Every N Days</option>
				</select>
			</label>

			{frequency === 'every_n_days' && (
				<label>
					<span className="form-label">Repeat every how many days? *</span>
					<input
						type="number"
						className="form-input"
						min="1"
						value={customInterval}
						onChange={e => setCustomInterval(e.target.value)}
					/>
				</label>
			)}

			{(frequency === 'weekly' || frequency === 'monthly') && (
				<label>
					<span className="form-label">Times per period</span>
					<input
						type="number"
						className="form-input"
						min="1"
						value={timesPerPeriod}
						onChange={e => setTimesPerPeriod(e.target.value)}
					/>
				</label>
			)}

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

			<ButtonComponent>Save Habit</ButtonComponent>
		</form>
	);
}
