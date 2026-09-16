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

/**
 * The same URL under the webcal: scheme.
 *
 * iOS never offers Calendar as a target for a downloaded file — it only accepts
 * calendars through this scheme, which opens Calendar directly and offers to
 * subscribe. It is also the only path where X-WR-CALNAME and
 * X-APPLE-CALENDAR-COLOR are honoured, so the Habits calendar is created with
 * its colour rather than needing to exist beforehand.
 */
export function webcalUrl(ics, origin = '') {
	const url = calendarUrl(ics, origin);
	if (!url) return null;

	return url.replace(/^https?:/, 'webcal:');
}
