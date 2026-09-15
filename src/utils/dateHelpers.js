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

// Stable YYYY-MM-DD key for the date as it reads on the user's own calendar.
// Unlike getUniqueDateIdentifier this never shifts across the UTC boundary, so
// it is safe to build cache keys from.
export function getLocalDateKey(date) {
	const d = new Date(date);
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${month}-${day}`;
}

export function addMonths(date, count) {
	const d = new Date(date.getFullYear(), date.getMonth() + count, 1);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function formatMonthTitle(date) {
	return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

// Days making up a Monday-first calendar grid for the month containing `date`,
// padded with the adjacent months' days so every row holds seven. Only as many
// rows as the month actually needs, so short months do not render a blank week.
export function getMonthGrid(date) {
	const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
	const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	const gridStart = getStartOfWeek(firstOfMonth);

	const leadingDays = Math.round((firstOfMonth - gridStart) / (24 * 60 * 60 * 1000));
	const weeks = Math.ceil((leadingDays + daysInMonth) / 7);

	const days = [];
	const cursor = new Date(gridStart);

	for (let i = 0; i < weeks * 7; i++) {
		days.push({
			date: new Date(cursor),
			inMonth: cursor.getMonth() === date.getMonth(),
		});
		cursor.setDate(cursor.getDate() + 1);
	}

	return days;
}
