// Serves a calendar the app generated on the device.
//
// iOS strips the extension from locally-generated files, so Calendar never
// recognises them. Fetching the same bytes from a URL with a proper
// Content-Type and filename is the route iOS does handle: Safari hands it
// straight to Calendar. The content travels in the query string, so this
// function stores nothing and knows nothing about any user.

const MAX_ENCODED_BYTES = 6000;

exports.handler = async event => {
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'X-Content-Type-Options': 'nosniff',
	};

	const encoded = event.queryStringParameters?.c;

	if (!encoded) {
		return {
			statusCode: 400,
			headers: { ...headers, 'Content-Type': 'text/plain' },
			body: 'Missing calendar data',
		};
	}

	if (encoded.length > MAX_ENCODED_BYTES) {
		return {
			statusCode: 413,
			headers: { ...headers, 'Content-Type': 'text/plain' },
			body: 'Calendar too large for this route',
		};
	}

	let ics;
	try {
		ics = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
	} catch {
		return {
			statusCode: 400,
			headers: { ...headers, 'Content-Type': 'text/plain' },
			body: 'Could not decode calendar data',
		};
	}

	// Only ever echo back something that is actually a calendar, so this cannot
	// be used to serve arbitrary content from the site's origin.
	if (!ics.startsWith('BEGIN:VCALENDAR') || !ics.trimEnd().endsWith('END:VCALENDAR')) {
		return {
			statusCode: 400,
			headers: { ...headers, 'Content-Type': 'text/plain' },
			body: 'Not a calendar',
		};
	}

	return {
		statusCode: 200,
		headers: {
			...headers,
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': 'inline; filename="habits.ics"',
			'Cache-Control': 'no-store',
		},
		body: ics,
	};
};
