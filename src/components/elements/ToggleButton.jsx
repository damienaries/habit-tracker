export default function ToggleButton({ checked, onChange }) {
	return (
		<label className="relative inline-flex items-center cursor-pointer">
			<input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
			<div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 peer-checked:bg-black"></div>
		</label>
	);
}
