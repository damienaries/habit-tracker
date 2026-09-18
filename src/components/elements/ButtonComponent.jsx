export default function ButtonComponent({
	href,
	target,
	rel,
	download,
	onClick,
	size = 'base',
	variant = 'primary',
	disabled = false,
	loading = false,
	iconLeft = null,
	iconRight = null,
	fullWidth = false,
	children,
}) {
	const baseclasses =
		'inline-flex items-center justify-center gap-2 font-semibold text-center rounded-[var(--radius-sm)] cursor-pointer min-h-[40px] transition-[background-color,transform] duration-[var(--dur-quick)] ease-[var(--ease-out)] active:scale-[0.97]';

	const sizeClasses = {
		sm: 'text-sm px-3 py-2 min-h-[34px]',
		base: 'text-base px-4 py-2',
		lg: 'text-lg px-6 py-3',
	}[size];

	const variantClasses = {
		primary: 'bg-[var(--c-text)] text-white hover:opacity-90',
		secondary:
			'bg-[var(--c-surface)] text-[var(--c-text)] border border-[var(--c-border-strong)] hover:bg-[var(--c-surface-sunk)]',
		danger: 'bg-[var(--c-danger)] text-white hover:opacity-90',
		success: 'bg-[var(--c-done)] text-white hover:opacity-90',
		warning: 'bg-[var(--c-warn)] text-[var(--c-text)] hover:opacity-90',
	}[variant];

	const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

	const widthClass = fullWidth ? 'w-full' : '';

	const classes = `${baseclasses} ${sizeClasses} ${variantClasses} ${disabledClasses} ${widthClass}`;

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
				target={target}
				rel={rel}
				download={download}
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
