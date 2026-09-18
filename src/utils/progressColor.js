/**
 * Colour for a completion ratio.
 *
 * A single hue fading from pale to saturated wastes most of its range — the
 * difference between a quarter done and half done is almost invisible at the
 * size of a calendar cell. Running through the spectrum instead gives every
 * step its own hue, and each stop is darker and more saturated than the last,
 * so the scale also reads correctly in greyscale.
 *
 * Green is reserved for a day that is genuinely finished.
 */
const RAMP = [
	{ at: 0, rgb: [246, 236, 228] }, // untouched — barely tinted paper
	{ at: 0.25, rgb: [255, 176, 56] }, // amber
	{ at: 0.5, rgb: [198, 178, 48] }, // citron
	{ at: 0.75, rgb: [92, 166, 86] }, // green
	{ at: 1, rgb: [15, 138, 128] }, // deep teal — done
];

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

export function progressRgb(ratio) {
	const clamped = Math.min(Math.max(ratio, 0), 1);

	for (let i = 1; i < RAMP.length; i++) {
		const prev = RAMP[i - 1];
		const next = RAMP[i];
		if (clamped > next.at) continue;

		const span = next.at - prev.at;
		const t = span === 0 ? 0 : (clamped - prev.at) / span;

		return [
			lerp(prev.rgb[0], next.rgb[0], t),
			lerp(prev.rgb[1], next.rgb[1], t),
			lerp(prev.rgb[2], next.rgb[2], t),
		];
	}

	return RAMP[RAMP.length - 1].rgb;
}

export function progressColor(ratio) {
	const [r, g, b] = progressRgb(ratio);
	return `rgb(${r} ${g} ${b})`;
}

// Relative luminance, so text flips when the fill actually gets dark rather
// than at a ratio guessed up front.
export function readableInk(ratio) {
	const [r, g, b] = progressRgb(ratio).map(channel => {
		const c = channel / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});

	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	return luminance > 0.45 ? 'var(--c-text)' : '#ffffff';
}
