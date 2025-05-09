export function getStartOfWeek(date) {
	const d = new Date(date.getTime()); // clone, don't mutate input
	const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
	const diff = d.getDate() - (day === 0 ? 6 : day - 1); // back to Monday
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function getEndOfWeek(date) {
	const start = getStartOfWeek(date);
	const end = new Date(start);
	end.setDate(start.getDate() + 6); // Sunday
	return new Date(end.setHours(23, 59, 59, 999));
}

export function isSameDay(date1, date2) {
	return new Date(date1).toDateString() === new Date(date2).toDateString();
}

export function formatDateTitle(date) {
	return new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	}).format(date);
}
