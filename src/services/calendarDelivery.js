// Hands the generated file to the OS. On iOS the share sheet lists Calendar
// directly, which is a far better route than a Safari download — so try that
// first and fall back to a plain download everywhere else.
export async function deliverCalendar(ics, filename = 'habits.ics') {
	const file = new File([ics], filename, { type: 'text/calendar' });

	if (navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file], title: 'Habits' });
			return 'shared';
		} catch (error) {
			if (error.name === 'AbortError') return 'cancelled';
			// Anything else: fall through and try a download instead.
		}
	}

	const url = URL.createObjectURL(file);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();

	// Revoking straight away cancels the download in some browsers.
	setTimeout(() => URL.revokeObjectURL(url), 10000);

	return 'downloaded';
}
