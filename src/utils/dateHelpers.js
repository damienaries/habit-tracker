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
	return getLocalDateKey(date1) === getLocalDateKey(date2);
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

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

// Stable YYYY-MM-DD key for the date as it reads on the user's own calendar.
// Unlike getUniqueDateIdentifier this never shifts across the UTC boundary, so
// it is safe to build cache keys from.
export function getLocalDateKey(date) {
	// Already a key. Passing it through `new Date` would parse it as UTC
	// midnight, which is the previous day anywhere west of Greenwich — that is
	// how a todo set for tomorrow landed on today in California.
	if (typeof date === 'string' && DATE_KEY.test(date)) return date;

	const d =
		typeof date === 'string'
			? new Date(`${date}T00:00:00`) // any other string: read it as local
			: new Date(date);

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

// Short label for a day in the near future: "Tomorrow" beats "Thu 18 Sep" when
// it applies, and the weekday matters more than the year when it does not.
export function formatRelativeDay(date, today = new Date()) {
	const days = Math.round(
		(new Date(date).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) /
			(24 * 60 * 60 * 1000)
	);

	if (days === 0) return 'Today';
	if (days === 1) return 'Tomorrow';

	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	}).format(new Date(date));
}

export function getWeekDays(date) {
	const start = getStartOfWeek(date);

	return Array.from({ length: 7 }, (_, i) => {
		const day = new Date(start);
		day.setDate(start.getDate() + i);
		day.setHours(0, 0, 0, 0);
		return day;
	});
}

export function addWeeks(date, count) {
	const d = new Date(date);
	d.setDate(d.getDate() + count * 7);
	d.setHours(0, 0, 0, 0);
	return d;
}

// "15 – 21 Sep" for a week inside one month, "29 Sep – 5 Oct" when it straddles.
export function formatWeekTitle(date) {
	const days = getWeekDays(date);
	const start = days[0];
	const end = days[6];

	const month = d => new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d);

	return start.getMonth() === end.getMonth()
		? `${start.getDate()} – ${end.getDate()} ${month(end)}`
		: `${start.getDate()} ${month(start)} – ${end.getDate()} ${month(end)}`;
}
