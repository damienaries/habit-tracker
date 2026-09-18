import { describe, it, expect } from 'vitest';
import { progressRgb, progressColor, readableInk } from './progressColor';

const luminance = ratio => {
	const [r, g, b] = progressRgb(ratio).map(c => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe('progress ramp', () => {
	it('pins the ends', () => {
		expect(progressRgb(0)).toEqual([246, 236, 228]);
		expect(progressRgb(1)).toEqual([15, 138, 128]);
	});

	it('clamps anything outside the range', () => {
		expect(progressRgb(-1)).toEqual(progressRgb(0));
		expect(progressRgb(5)).toEqual(progressRgb(1));
	});

	it('gets steadily darker, so the scale survives greyscale', () => {
		const steps = [0, 0.25, 0.5, 0.75, 1].map(luminance);
		for (let i = 1; i < steps.length; i++) {
			expect(steps[i]).toBeLessThan(steps[i - 1]);
		}
	});

	it('separates a quarter done from half done', () => {
		// The old single-hue fade made these nearly identical at cell size.
		const [r1, g1, b1] = progressRgb(0.25);
		const [r2, g2, b2] = progressRgb(0.5);
		const distance = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

		expect(distance).toBeGreaterThan(60);
	});

	it('interpolates between stops rather than stepping', () => {
		const mid = progressRgb(0.125);
		expect(mid).not.toEqual(progressRgb(0));
		expect(mid).not.toEqual(progressRgb(0.25));
	});

	it('emits a usable css colour', () => {
		expect(progressColor(1)).toBe('rgb(15 138 128)');
	});

	it('flips the ink once the fill goes dark', () => {
		expect(readableInk(0)).toBe('var(--c-text)');
		expect(readableInk(1)).toBe('#ffffff');
	});
});
