import HabitForm from '../components/HabitForm.jsx';

export default function CreateHabitView() {
	return (
		<div className="container">
			<h1 className="mb-4">Create Habit</h1>
			<p className="text-sm">What do you want to add to your routine today?</p>

			<HabitForm />
		</div>
	);
}
