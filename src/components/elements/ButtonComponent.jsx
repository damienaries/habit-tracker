export default function ButtonComponent({
	href,
	onClick,
	size = 'base',
	variant = 'primary',
	disabled = false,
	loading = false,
	iconLeft = null,
	iconRight = null,
	children,
}) {
	const baseclasses =
		'inline-flex items-center justify-center gap-6 font-medium text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md cursor-pointer';

	const sizeClasses = {
		sm: 'text-sm px-3 py-1.5',
		base: 'text-base px-4 py-2',
		lg: 'text-lg px-6 py-3',
	}[size];

	const variantClasses = {
		primary: 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-700',
		secondary:
			'bg-gray-100 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 border border-gray-300',
	}[variant];

	const disabledClasses =
		disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

	const classes = `${baseclasses} ${sizeClasses} ${variantClasses} ${disabledClasses}`;

	const content = (
		<>
			{loading && (
				<span className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
			)}
			{!loading && iconLeft && <span className="icon-left">{iconLeft}</span>}
			{children}
			{!loading && iconRight && <span className="icon-right">{iconRight}</span>}
		</>
	);

	if (href) {
		return (
			<a
				href={href}
				onClick={onClick}
				className={classes}
				aria-disabled={disabled}
			>
				{content}
			</a>
		);
	}

	return (
		<button
			type={onClick ? 'button' : 'submit'}
			onClick={onClick}
			className={classes}
			disabled={disabled || loading}
		>
			{content}
		</button>
	);
}
