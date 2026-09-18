import { useState } from 'react';
import HabitForm from '../components/HabitForm.jsx';
import TodoForm from '../components/TodoForm.jsx';

const TABS = [
	{
		id: 'habit',
		label: 'Habit',
		blurb: 'Something you want to repeat — it builds a streak.',
	},
	{
		id: 'todo',
		label: 'To do',
		blurb: 'A one-off for a particular day. No streak, just done or not.',
	},
];

export default function CreateHabitView() {
	const [tab, setTab] = useState('habit');
	const active = TABS.find(t => t.id === tab);

	return (
		<div className="px-4 py-5">
			<h1 className="text-display text-[1.9rem] mb-4">Add something</h1>

			<div
				role="tablist"
				aria-label="What to add"
				className="flex p-1 gap-1 rounded-[var(--radius)] bg-[var(--c-surface-sunk)] mb-3"
			>
				{TABS.map(({ id, label }) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={tab === id}
						onClick={() => setTab(id)}
						className={`flex-1 min-h-[38px] rounded-[var(--radius-sm)] text-sm font-semibold
							transition-colors duration-[var(--dur-quick)] ease-[var(--ease-out)]
							${
								tab === id
									? 'bg-[var(--c-surface)] text-[var(--c-text)] shadow-sm'
									: 'text-[var(--c-muted)]'
							}`}
					>
						{label}
					</button>
				))}
			</div>

			<p className="text-sm text-[var(--c-text-soft)] mb-5">{active.blurb}</p>

			{tab === 'habit' ? <HabitForm /> : <TodoForm />}
		</div>
	);
}
