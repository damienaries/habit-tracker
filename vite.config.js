import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';

// Netlify exposes the commit it is building; fall back to local git, and to a
// placeholder if neither is available so the build never fails over this.
function buildRef() {
	if (process.env.COMMIT_REF) return process.env.COMMIT_REF.slice(0, 7);
	try {
		return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return 'unknown';
	}
}

// https://vite.dev/config/
export default defineConfig({
	define: {
		__BUILD_REF__: JSON.stringify(buildRef()),
		__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
	},
	plugins: [
		react(),
		tailwindcss(),
		svgr(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['icons/fire.svg', 'icons/app-icon-180.png'],
			manifest: {
				name: 'Habit Tracker',
				short_name: 'Habits',
				description: 'Track your daily and weekly habits with ease',
				theme_color: '#fff6f0',
				background_color: '#fff6f0',
				display: 'standalone',
				display_override: ['window-controls-overlay'],
				start_url: '/',
				scope: '/',
				icons: [
					{ src: 'icons/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: 'icons/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{
						src: 'icons/app-icon-maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						// Separate art with a safe zone — Android crops maskable icons to
						// a circle, and SVGs were being rejected outright.
						purpose: 'maskable',
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
