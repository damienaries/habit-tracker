import { useState } from 'react';
import { useCreateTodo } from '../hooks/useTodoMutations';
import { useUser } from '../contexts/UserContext';
import { getLocalDateKey, generateDateOffset, getStartOfToday } from '../utils/dateHelpers';
import ButtonComponent from './elements/ButtonComponent';

const QUICK_DAYS = [
	{ label: 'Today', offset: 0 },
	{ label: 'Tomorrow', offset: 1 },
];

export default function TodoForm() {
	const { user } = useUser();
	const createMutation = useCreateTodo();

	const [title, setTitle] = useState('');
	const [details, setDetails] = useState('');
	const [dueDate, setDueDate] = useState(() => getLocalDateKey(getStartOfToday()));
	const [error, setError] = useState(null);
	const [message, setMessage] = useState(null);

	const setQuickDay = offset =>
		setDueDate(getLocalDateKey(generateDateOffset(getStartOfToday(), offset)));

	const handleSubmit = async e => {
		e.preventDefault();

		if (!title.trim()) {
			setError('Give it a name so you know what it is.');
			return;
		}

		try {
			await createMutation.mutateAsync({ userId: user.id, title, details, dueDate });
			setTitle('');
			setDetails('');
			setError(null);
			setMessage('Added.');
			setTimeout(() => setMessage(null), 2500);
		} catch (err) {
			console.error(err);
			setError('Could not save that. Try again.');
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-y-5 w-full">
			{error && <p className="text-sm text-[var(--c-danger)]">{error}</p>}
			{message && (
				<p className="text-sm text-[var(--c-done)] bg-[var(--c-done-soft)] px-3 py-2 rounded-[var(--radius-sm)]">
					{message}
				</p>
			)}

			<label>
				<span className="form-label">What do you need to do? *</span>
				<input
					type="text"
					className="form-input"
					value={title}
					onChange={e => setTitle(e.target.value)}
					placeholder="Pick up the parcel"
				/>
			</label>

			<div>
				<span className="form-label">When?</span>
				<div className="flex flex-wrap gap-2 mb-2">
					{QUICK_DAYS.map(({ label, offset }) => {
						const value = getLocalDateKey(generateDateOffset(getStartOfToday(), offset));
						return (
							<button
								key={label}
								type="button"
								onClick={() => setQuickDay(offset)}
								className={`px-3 py-2 rounded-full border text-xs font-medium transition-colors ${
									dueDate === value
										? 'bg-[var(--c-text)] text-white border-[var(--c-text)]'
										: 'bg-[var(--c-surface)] text-[var(--c-text-soft)] border-[var(--c-border)] hover:bg-[var(--c-surface-sunk)]'
								}`}
							>
								{label}
							</button>
						);
					})}
				</div>
				<input
					type="date"
					className="form-input"
					value={dueDate}
					onChange={e => setDueDate(e.target.value)}
				/>
			</div>

			<label>
				<span className="form-label">Details (optional)</span>
				<textarea
					rows="2"
					className="form-input"
					value={details}
					onChange={e => setDetails(e.target.value)}
				/>
			</label>

			<ButtonComponent disabled={createMutation.isPending} fullWidth>
				{createMutation.isPending ? 'Saving...' : 'Add to do'}
			</ButtonComponent>
		</form>
	);
}
