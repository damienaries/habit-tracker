import { useQuery } from '@tanstack/react-query';
import { getTodosForDate } from '../services/todoService';
import { todoKeys } from '../queries/todoKeys';
import { useToggleTodo, useDeleteTodo } from '../hooks/useTodoMutations';
import { useUser } from '../contexts/UserContext';
import { isSameDay } from '../utils/dateHelpers';

function TodoRow({ todo, editable }) {
	const toggle = useToggleTodo();
	const remove = useDeleteTodo();
	const done = Boolean(todo.completedOn);

	return (
		<div
			className={`group relative overflow-hidden rounded-[var(--radius)] flex items-start gap-3 p-3
				border transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)]
				${
					done
						? 'bg-[var(--c-done-soft)] border-[color-mix(in_srgb,var(--c-done)_28%,transparent)]'
						: 'bg-[var(--c-surface)] border-[var(--c-border)]'
				}`}
		>
			<button
				type="button"
				onClick={() => editable && toggle.mutate({ id: todo.id })}
				disabled={!editable || toggle.isPending}
				aria-pressed={done}
				aria-label={done ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`}
				className={`shrink-0 grid place-items-center w-9 h-9 -my-1 -ml-1 rounded-full
					transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)]
					${editable ? 'cursor-pointer active:scale-90' : 'cursor-not-allowed'}`}
			>
				<span
					className={`grid place-items-center w-[24px] h-[24px] rounded-full border-2
						transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)]
						${
							done
								? 'bg-[var(--c-done)] border-[var(--c-done)] scale-105'
								: 'bg-transparent border-[var(--c-border-strong)]'
						}
						${editable ? '' : 'opacity-40'}`}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="3.25"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
						className={`w-[13px] h-[13px] text-white transition-opacity duration-[var(--dur-quick)] ${
							done ? 'opacity-100' : 'opacity-0'
						}`}
					>
						<path d="M20 6 9 17l-5-5" />
					</svg>
				</span>
			</button>

			<div className="flex-1 min-w-0">
				<p
					className={`font-medium leading-snug transition-colors ${
						done ? 'text-[var(--c-muted)] line-through' : ''
					}`}
				>
					{todo.title}
				</p>
				{todo.details && (
					<p className="text-[0.78rem] text-[var(--c-muted)] mt-0.5">{todo.details}</p>
				)}
			</div>

			<button
				type="button"
				onClick={() => remove.mutate({ id: todo.id })}
				aria-label={`Delete ${todo.title}`}
				className="shrink-0 w-9 h-9 -my-1 -mr-1 grid place-items-center rounded-full text-[var(--c-muted)] opacity-60 transition-opacity hover:opacity-100"
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					aria-hidden="true"
					className="w-4 h-4"
				>
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
	);
}

/**
 * One-off items for a given day. They sit above habits because they are the
 * things you will forget — a habit is already a pattern you are building.
 */
export default function TodoList({ date, editable }) {
	const { user } = useUser();
	const canEdit = editable ?? isSameDay(date, new Date());

	const { data: todos = [] } = useQuery({
		queryKey: todoKeys.byDate(user?.id, date),
		queryFn: () => getTodosForDate(user.id, date),
		enabled: !!user,
	});

	if (todos.length === 0) return null;

	const outstanding = todos.filter(todo => !todo.completedOn).length;

	return (
		<section className="mb-5">
			<div className="flex items-baseline justify-between mb-2">
				<h2 className="text-eyebrow">To do</h2>
				{outstanding > 0 && (
					<span className="text-[0.72rem] text-[var(--c-muted)] numerals">
						{outstanding} left
					</span>
				)}
			</div>

			<div className="flex flex-col gap-2">
				{todos.map(todo => (
					<TodoRow key={todo.id} todo={todo} editable={canEdit} />
				))}
			</div>
		</section>
	);
}
