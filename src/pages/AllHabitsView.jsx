import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllHabits } from '../services/habitService';
import { getAllTodos } from '../services/todoService';
import { habitKeys } from '../queries/habitKeys';
import { todoKeys } from '../queries/todoKeys';
import { getStats } from '../services/stats';
import { getDayProgress } from '../services/dayStatus';
import { FREQUENCY } from '../services/schedule';
import { useUser } from '../contexts/UserContext';
import { useToday } from '../hooks/useToday';
import { getWeekDays, getLocalDateKey } from '../utils/dateHelpers';
import HabitCard from '../components/HabitCard';
import ProgressRing from '../components/stats/ProgressRing';
import WeekBars from '../components/stats/WeekBars';
import ThisWeekStrip from '../components/stats/ThisWeekStrip';
import HabitStatRow from '../components/stats/HabitStatRow';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function describe(habit) {
	switch (habit.frequency) {
		case FREQUENCY.DAILY:
			return 'Every day';
		case FREQUENCY.SPECIFIC_DAYS:
			return (habit.daysOfWeek || []).map(d => DAY_NAMES[d]).join(', ') || 'No days set';
		default: {
			const n = habit.timesPerPeriod || 1;
			return `${n}× a week`;
		}
	}
}

function hueFor(id) {
	const key = String(id);
	let hash = 0;
	for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
	return `var(--h-${(hash % 5) + 1})`;
}

// How the week is going, in a sentence. A number alone does not tell you
// whether it is a good number.
function verdict(stats) {
	const { thisWeek, previous, average } = stats;
	if (thisWeek.planned === 0) return 'Nothing planned this week yet.';

	const left = thisWeek.planned - thisWeek.done;
	if (left === 0) return 'Everything done. Week complete.';

	if (average !== null && previous && previous.planned > 0) {
		if (thisWeek.ratio > previous.ratio) return `${left} to go — ahead of last week.`;
		if (thisWeek.ratio < previous.ratio * 0.6) return `${left} to go — behind last week.`;
	}

	return `${left} to go this week.`;
}

export default function AllHabitsView() {
	const { user } = useUser();
	const today = useToday();
	const [showPast, setShowPast] = useState(false);

	const { data: habits, isLoading } = useQuery({
		queryKey: habitKeys.byUser(user?.id),
		queryFn: () => getAllHabits(user.id),
		enabled: !!user,
	});

	const { data: todos = [] } = useQuery({
		queryKey: todoKeys.byUser(user?.id),
		queryFn: () => getAllTodos(user.id),
		enabled: !!user,
	});

	const all = useMemo(() => habits || [], [habits]);
	const active = useMemo(() => all.filter(h => !h.endDate), [all]);
	const past = useMemo(
		() => all.filter(h => h.endDate).sort((a, b) => new Date(b.endDate) - new Date(a.endDate)),
		[all]
	);

	const stats = useMemo(() => getStats(active, todos, today), [active, todos, today]);

	const weekDays = useMemo(() => getWeekDays(today), [today]);
	const weekProgress = useMemo(() => {
		const map = new Map();
		for (const date of weekDays) {
			map.set(getLocalDateKey(date), getDayProgress(active, date, today, todos));
		}
		return map;
	}, [weekDays, active, todos, today]);

	if (isLoading) {
		return (
			<div className="px-4 py-5 space-y-3" aria-busy="true">
				<div className="h-40 rounded-[var(--radius)] bg-[var(--c-surface-sunk)] animate-pulse" />
				<div className="h-24 rounded-[var(--radius)] bg-[var(--c-surface-sunk)] animate-pulse" />
			</div>
		);
	}

	if (all.length === 0) {
		return (
			<div className="px-4 py-16 text-center">
				<h1 className="text-display text-[1.6rem]">No habits yet</h1>
				<p className="text-[var(--c-muted)] mt-2">
					Add one and this page starts keeping score.
				</p>
			</div>
		);
	}

	return (
		<div className="px-4 py-5 space-y-8">
			<section className="flex items-center gap-4">
				<ProgressRing
					done={stats.thisWeek.done}
					planned={stats.thisWeek.planned}
					ratio={stats.thisWeek.ratio}
					caption="this week"
				/>
				<div className="min-w-0">
					<h1 className="text-display text-[1.5rem] leading-tight">{verdict(stats)}</h1>
					{stats.average !== null && (
						<p className="text-[0.8rem] text-[var(--c-muted)] numerals mt-1.5">
							{Math.round(stats.average * 100)}% average over the last{' '}
							{stats.history.filter(w => w.planned > 0 && !w.inProgress).length} weeks
						</p>
					)}
				</div>
			</section>

			<WeekBars history={stats.history} />

			<ThisWeekStrip days={weekDays} progress={weekProgress} today={today} />

			{active.length > 0 && (
				<section className="space-y-3">
					{active.map(habit => (
						<HabitStatRow
							key={habit.id}
							habit={habit}
							today={today}
							hue={hueFor(habit.id)}
							subtitle={describe(habit)}
						/>
					))}
				</section>
			)}

			{past.length > 0 && (
				<section className="space-y-3">
					<button
						type="button"
						onClick={() => setShowPast(v => !v)}
						className="text-eyebrow flex items-center gap-1.5"
						aria-expanded={showPast}
					>
						Past · {past.length}
						<span aria-hidden="true" className={showPast ? 'rotate-180' : ''}>
							⌄
						</span>
					</button>

					{showPast && (
						<ul className="space-y-3">
							{past.map(habit => (
								<li key={habit.id}>
									<HabitCard habit={habit} date={today} dayCard={false} />
								</li>
							))}
						</ul>
					)}
				</section>
			)}
		</div>
	);
}
