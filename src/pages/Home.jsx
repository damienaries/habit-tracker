import DayCard from '../components/DayCard.jsx';

function getNextDates(n) {
	const dates = [];
	const today = new Date();

	for (let i = 0; i < n; i++) {
		const nextDate = new Date(today);
		nextDate.setDate(today.getDate() + i);
		dates.push(nextDate);
	}

	return dates;
}

export default function Home() {
	const upcomingDates = getNextDates(7);

	return (
		<div className="container overflow-y-scroll ">
			<h1 className="mb-4">Habit Tracker</h1>

			<div className="flex flex-col gap-4">
				{upcomingDates?.map((date) => (
					<DayCard key={date.toDateString()} date={date} />
				))}
			</div>
		</div>
	);
}
