import { useRef } from 'react';

export default function InfiniteScrollContainer({
	children,
	topRef,
	bottomRef,
}) {
	const scrollContainerRef = useRef(null);

	return (
		<div
			ref={scrollContainerRef}
			className="fixed inset-0 bottom-20 overflow-y-scroll snap-y snap-mandatory py-16 flex flex-col items-center scroll-smooth"
		>
			{/* Top loading trigger */}
			<div ref={topRef} className="h-4 w-full" />

			<div className="w-full max-w-2xl px-4 pt-8">{children}</div>

			{/* Bottom loading trigger */}
			<div ref={bottomRef} className="h-4 w-full" />
		</div>
	);
}
