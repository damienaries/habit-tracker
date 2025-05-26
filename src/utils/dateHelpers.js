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

export function getUniqueDateIdentifier(date) {
	return new Date(date).toISOString().split('T')[0];
}

export function generateDateOffset(baseDate, offset) {
	const date = new Date(baseDate);
	date.setDate(date.getDate() + offset);
	date.setHours(0, 0, 0, 0);
	return date;
}

export function generateDateRange(baseDate, start, end) {
	const dates = [];
	for (let i = start; i <= end; i++) {
		dates.push(generateDateOffset(baseDate, i));
	}
	return dates;
}

export function getStartOfToday() {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	return date;
}
