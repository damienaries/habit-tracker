import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './app.css';
import App from './App.jsx';

// Import seeder only when enabled via environment variable
if (import.meta.env.DEV_SEEDER === 'true') {
	import('./utils/devSeeder.js').then(() => {
		console.log('🌱 Dev seeder loaded! Available commands:');
		console.log('  • window.devSeeder.clearDatabase()');
		console.log('  • window.devSeeder.resetWithSampleData()');
	});
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</StrictMode>
);
