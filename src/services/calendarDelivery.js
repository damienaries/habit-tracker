export const CALENDAR_ENDPOINT = '/.netlify/functions/calendar';

// Netlify caps the request line well below this; stay clear of the edge.
const MAX_ENCODED_LENGTH = 6000;

export function encodeCalendar(ics) {
	const bytes = new TextEncoder().encode(ics);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function calendarUrl(ics, origin = '') {
	const encoded = encodeCalendar(ics);
	if (encoded.length > MAX_ENCODED_LENGTH) return null;

	return `${origin}${CALENDAR_ENDPOINT}?c=${encoded}`;
}

function downloadCalendar(ics, filename) {
	const file = new File([ics], filename, { type: 'text/calendar' });
	const url = URL.createObjectURL(file);
	const link = document.createElement('a');

	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();

	setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Hands the calendar to the OS.
 *
 * Opening a URL is the only route iOS reliably passes to Calendar — a file
 * built in the browser loses its .ics extension on the way to Files, and
 * without the extension Calendar is never offered. Falls back to a download
 * for calendars too large to fit in a URL, and on desktop where downloading
 * works fine.
 */
export function deliverCalendar(ics, filename = 'habits.ics') {
	const url = calendarUrl(ics, window.location.origin);

	if (!url) {
		downloadCalendar(ics, filename);
		return 'downloaded';
	}

	// A new tab, so a standalone PWA hands off to Safari rather than trying to
	// render the calendar inside the app shell.
	const opened = window.open(url, '_blank');
	if (!opened) {
		downloadCalendar(ics, filename);
		return 'downloaded';
	}

	return 'opened';
}
