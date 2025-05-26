import HabitForm from '../components/HabitForm.jsx';

export default function CreateHabitView() {
	return (
		<div className="container">
			<p className="mb-4 text-center">
				What do you want to add to your routine today?
			</p>

			<HabitForm />
		</div>
	);
}
