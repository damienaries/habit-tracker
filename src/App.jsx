import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TabNavigation from './components/TabNavigation';
import Header from './components/Header';
import Today from './pages/Today';
import CalendarView from './pages/CalendarView';
import CreateHabitView from './pages/CreateHabitView';
import AllHabitsView from './pages/AllHabitsView';
import { UserProvider, useUser } from './contexts/UserContext';
import Onboarding from './components/Onboarding';

const routes = [
	{ path: '/', element: <Today /> },
	{ path: '/week', element: <CalendarView view="week" /> },
	{ path: '/month', element: <CalendarView view="month" /> },
	{ path: '/create', element: <CreateHabitView /> },
	{ path: '/habits', element: <AllHabitsView /> },
];

function AppContent() {
	const { user } = useUser();

	if (!user) {
		return <Onboarding />;
	}

	return (
		<Router>
			<div className="min-h-screen flex flex-col">
				<Header />

				{/* Header and tab bar are fixed, so the scrolling column clears both
					    plus whatever the device reserves for the notch and home bar. */}
				<main
					className="flex-1 mx-auto w-full max-w-[520px]"
					style={{
						paddingTop: 'calc(var(--header-h) + var(--safe-top))',
						paddingBottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 8px)',
					}}
				>
					<Routes>
						{routes.map(({ path, element }) => (
							<Route key={path} path={path} element={element} />
						))}
					</Routes>
				</main>

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
