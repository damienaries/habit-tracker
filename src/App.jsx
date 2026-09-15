import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TabNavigation from './components/TabNavigation';
import Header from './components/Header';
import Today from './pages/Today';
import MonthView from './pages/MonthView';
import CreateHabitView from './pages/CreateHabitView';
import AllHabitsView from './pages/AllHabitsView';
import { UserProvider } from './contexts/UserContext';
import { useUser } from './contexts/UserContext';
import Onboarding from './components/Onboarding';

const routes = [
	{ path: '/', element: <Today />, title: 'Today' },
	{ path: '/month', element: <MonthView />, title: 'Month' },
	{ path: '/create', element: <CreateHabitView />, title: 'Create Habit' },
	{ path: '/habits', element: <AllHabitsView />, title: 'All Habits' },
];

function AppContent() {
	const { user } = useUser();

	if (!user) {
		return <Onboarding />;
	}

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

export default function App() {
	return (
		<UserProvider>
			<AppContent />
		</UserProvider>
	);
}
