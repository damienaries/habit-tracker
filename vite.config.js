import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		svgr(),
		VitePWA({
			registerType: 'prompt',
			includeAssets: ['icons/fire.svg'],
			manifest: {
				name: 'Habit Tracker',
				short_name: 'Habits',
				description: 'Track your daily and weekly habits with ease',
				theme_color: '#000000',
				background_color: '#ffffff',
				display: 'standalone',
				display_override: ['window-controls-overlay'],
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: 'icons/fire.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'any maskable',
					},
					{
						src: 'icons/fire.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
				clientsClaim: true,
				skipWaiting: true,
				cleanupOutdatedCaches: true,
			},
			devOptions: {
				enabled: true,
			},
			version: '1.0.0',
		}),
	],
});
