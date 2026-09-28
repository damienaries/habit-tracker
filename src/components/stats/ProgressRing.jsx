import { progressColor } from '../../utils/progressColor';

const SIZE = 132;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProgressRing({ done, planned, ratio, caption }) {
	const percent = Math.round(ratio * 100);

	return (
		<div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
			<svg width={SIZE} height={SIZE} aria-hidden="true" className="-rotate-90">
				<circle
					cx={SIZE / 2}
					cy={SIZE / 2}
					r={RADIUS}
					fill="none"
					stroke="var(--c-idle)"
					strokeWidth={STROKE}
				/>
				<circle
					cx={SIZE / 2}
					cy={SIZE / 2}
					r={RADIUS}
					fill="none"
					stroke={progressColor(ratio)}
					strokeWidth={STROKE}
					strokeLinecap="round"
					strokeDasharray={CIRCUMFERENCE}
					strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(ratio, 1))}
					style={{
						transition:
							'stroke-dashoffset var(--dur-slow) var(--ease-out), stroke var(--dur-slow)',
					}}
				/>
			</svg>

			<div className="absolute inset-0 grid place-items-center text-center">
				<div>
					<p className="text-display text-[2rem] leading-none numerals">
						{planned === 0 ? '—' : `${percent}%`}
					</p>
					<p className="text-[0.72rem] text-[var(--c-muted)] numerals mt-1">
						{planned === 0 ? 'nothing planned' : `${done} of ${planned}`}
					</p>
					{caption && (
						<p className="text-[0.62rem] uppercase tracking-wider text-[var(--c-muted)] mt-0.5">
							{caption}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
