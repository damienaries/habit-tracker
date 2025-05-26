import { isSameDay } from '../utils/dateHelpers';
import HabitCheckbox from './HabitCheckbox';
import Icon from './icons/Icon';

export default function HabitCard({ habit, date }) {
	const alreadyDone = habit.lastDone && isSameDay(habit.lastDone, date);
	const iconScale = 1 + Math.floor(habit.streak / 5) * 0.25;

	return (
		<div
			className={`p-3 rounded-md w-full flex items-center gap-3 ${
				alreadyDone ? 'bg-green-50' : 'bg-gray-50'
			}`}
		>
			<HabitCheckbox habit={habit} date={date} />

			<div className="flex-1">
				<div className="font-medium">{habit.name}</div>
				{habit.details && (
					<div className="text-xs text-gray-500">{habit.details}</div>
				)}
			</div>

			<div className="text-xs text-gray-500 flex items-center gap-1">
				<Icon icon="fire" color="#f97316" scale={iconScale} />
				{habit.streak}
			</div>
		</div>
	);
}
