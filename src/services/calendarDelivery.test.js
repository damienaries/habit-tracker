import { describe, it, expect } from 'vitest';
import { encodeCalendar, calendarUrl, CALENDAR_ENDPOINT } from './calendarDelivery';

const MINIMAL = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n';

// Mirrors what the Netlify function does, so the round trip is verified rather
// than assumed.
function decodeLikeServer(encoded) {
	return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

describe('encodeCalendar', () => {
	it('round trips through the server decoding', () => {
		expect(decodeLikeServer(encodeCalendar(MINIMAL))).toBe(MINIMAL);
	});

	it('survives accented characters and emoji', () => {
		const ics = `BEGIN:VCALENDAR\r\nSUMMARY:Réviser le café 🎮\r\nEND:VCALENDAR\r\n`;
		expect(decodeLikeServer(encodeCalendar(ics))).toBe(ics);
	});

	it('is URL safe', () => {
		const ics = 'BEGIN:VCALENDAR\r\n' + 'X-PAD:' + '~'.repeat(200) + '\r\nEND:VCALENDAR\r\n';
		expect(encodeCalendar(ics)).not.toMatch(/[+/=]/);
	});

	it('preserves CRLF line endings the spec requires', () => {
		expect(decodeLikeServer(encodeCalendar(MINIMAL))).toContain('\r\n');
	});
});

describe('calendarUrl', () => {
	it('builds a URL against the function', () => {
		const url = calendarUrl(MINIMAL, 'https://example.app');
		expect(url.startsWith(`https://example.app${CALENDAR_ENDPOINT}?c=`)).toBe(true);
	});

	it('returns null when the calendar is too big for a URL', () => {
		const huge =
			'BEGIN:VCALENDAR\r\n' + 'X-PAD:' + 'a'.repeat(10000) + '\r\nEND:VCALENDAR\r\n';
		expect(calendarUrl(huge)).toBeNull();
	});

	it('accepts a realistic calendar of a dozen habits', () => {
		const event = [
			'BEGIN:VEVENT',
			'UID:habit-000000@habit-tracker',
			'DTSTAMP:20260915T070000Z',
			'DTSTART:20260915T090000',
			'DTEND:20260915T093000',
			'SUMMARY:A habit with a reasonably long name',
			'CATEGORIES:Habits',
			'RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA',
			'BEGIN:VALARM',
			'ACTION:DISPLAY',
			'TRIGGER;RELATED=START:PT0S',
			'DESCRIPTION:A habit with a reasonably long name',
			'END:VALARM',
			'END:VEVENT',
		].join('\r\n');

		const ics =
			'BEGIN:VCALENDAR\r\n' + Array(12).fill(event).join('\r\n') + '\r\nEND:VCALENDAR\r\n';

		expect(calendarUrl(ics)).not.toBeNull();
	});
});

describe('webcalUrl', () => {
	it('swaps the scheme so iOS hands it to Calendar', async () => {
		const { webcalUrl } = await import('./calendarDelivery');
		const url = webcalUrl(MINIMAL, 'https://habit-harbor.netlify.app');

		expect(url.startsWith('webcal://habit-harbor.netlify.app')).toBe(true);
		expect(url).toContain(`${CALENDAR_ENDPOINT}?c=`);
	});

	it('keeps the encoded payload identical to the https form', async () => {
		const { webcalUrl } = await import('./calendarDelivery');
		const https = calendarUrl(MINIMAL, 'https://example.app');
		const webcal = webcalUrl(MINIMAL, 'https://example.app');

		expect(webcal.split('?c=')[1]).toBe(https.split('?c=')[1]);
	});

	it('returns null when the calendar is too big', async () => {
		const { webcalUrl } = await import('./calendarDelivery');
		const huge = 'BEGIN:VCALENDAR\r\nX-PAD:' + 'a'.repeat(10000) + '\r\nEND:VCALENDAR\r\n';
		expect(webcalUrl(huge, 'https://example.app')).toBeNull();
	});
});
