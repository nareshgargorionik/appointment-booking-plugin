import type { JSX } from "react";

export default function SlotSkeleton(): JSX.Element {
  return (
    <div className="aaravpos-barber-scroll-area">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="aaravpos-barber-slot-section">
          {/* HEADER */}
          <div className="aaravpos-barber-slot-section-header">
            <div className="aaravpos-barber-slot-skeleton-title shimmer" />

            <div className="aaravpos-barber-slot-skeleton-arrow shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
