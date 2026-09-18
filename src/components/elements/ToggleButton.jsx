export default function ToggleButton({ checked, onChange }) {
	return (
		<label className="relative inline-flex items-center cursor-pointer">
			<input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
			<div className="w-11 h-6 bg-[var(--c-surface-sunk)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--c-surface)] after:border-[var(--c-border-strong)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--c-accent-soft)] peer-checked:bg-[var(--c-done)]"></div>
		</label>
	);
}
