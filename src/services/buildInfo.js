// Stamped in at build time by vite.config.js. Without this there is no way to
// tell from the phone whether a deploy has actually landed.
export const BUILD_REF = typeof __BUILD_REF__ === 'string' ? __BUILD_REF__ : 'dev';
export const BUILD_TIME = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : null;

export function formatBuild() {
	if (!BUILD_TIME) return `${BUILD_REF} · dev`;

	const when = new Date(BUILD_TIME).toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});

	return `${BUILD_REF} · ${when}`;
}
