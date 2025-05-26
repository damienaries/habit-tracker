import { icons } from '../../assets/icons';

export default function Icon({
	icon,
	color = 'currentColor',
	size = 'md',
	scale = 1,
	className = '',
}) {
	const sizeClasses = {
		xs: 'w-3 h-3',
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
		xl: 'w-10 h-10',
	};

	const IconComponent = icons[icon];

	if (!IconComponent) {
		console.warn(`Icon "${icon}" not found`);
		return null;
	}

	return (
		<div
			className={`${sizeClasses[size] || sizeClasses.md} ${className}`}
			style={{
				color,
				transform: `scale(${scale})`,
				transition: 'transform 0.3s ease-in-out',
			}}
		>
			<IconComponent className="w-full h-full" />
		</div>
	);
}
