import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TabNavigation from './components/TabNavigation';
import Header from './components/Header';
import Home from './pages/Home';
import CreateHabitView from './pages/CreateHabitView';
import AllHabitsView from './pages/AllHabitsView';

const routes = [
	{ path: '/', element: <Home />, title: 'Home' },
	{ path: '/create', element: <CreateHabitView />, title: 'Create Habit' },
	{ path: '/habits', element: <AllHabitsView />, title: 'All Habits' },
];

export default function App() {
	return (
		<Router>
			<div className="w-screen min-h-screen flex flex-col">
				{/* Fixed header */}
				<Header routes={routes} />

				{/* Centered container */}
				<main className="flex-1 mx-auto w-full max-w-[800px] mt-16 mb-16">
					<Routes>
						{routes.map(({ path, element }) => (
							<Route key={path} path={path} element={element} />
						))}
					</Routes>
				</main>

				{/* Bottom tab navigation */}
				<TabNavigation />
			</div>
		</Router>
	);
}
