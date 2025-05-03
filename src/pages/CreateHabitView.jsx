import HabitForm from '../components/HabitForm.jsx';

export default function CreateHabitView() {
	return (
		<div className="container">
			<h1 className="text-2xl font-bold">Create Habit</h1>
			<p className="text-sm">What do you want to add to your routine today?</p>

			<HabitForm />
		</div>
	);
}
