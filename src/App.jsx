import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TabNavigation from './components/TabNavigation';
import Home from './pages/Home';
import CreateHabitView from './pages/CreateHabitView';
import AllHabitsView from './pages/AllHabitsView';

export default function App() {
	return (
		<Router>
			<div className="w-screen min-h-screen">
				{/* Centered container */}
				<main className="flex-1 mx-auto w-full max-w-[800px]">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/create" element={<CreateHabitView />} />
						<Route path="/habits" element={<AllHabitsView />} />
					</Routes>
				</main>

				{/* Bottom tab navigation */}
				<TabNavigation />
			</div>
		</Router>
	);
}
