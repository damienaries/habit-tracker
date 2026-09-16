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
