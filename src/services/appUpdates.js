// The service worker is built with skipWaiting + clientsClaim, so a new version
// takes control as soon as it installs. The page that is already open, though,
// is still running the previous bundle — this reloads it once so an update is
// applied when it is detected rather than at the next launch.
export function reloadOnServiceWorkerUpdate() {
	if (import.meta.env.DEV) return;
	if (!('serviceWorker' in navigator)) return;

	// No controller yet means this is the first install, not an update.
	if (!navigator.serviceWorker.controller) return;

	let reloading = false;
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		if (reloading) return;
		reloading = true;
		window.location.reload();
	});
}
