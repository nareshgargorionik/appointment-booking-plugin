import type { JSX } from "react";

export default function SlotSkeleton(): JSX.Element {
  return (
    <div className="aaravpos-scroll-area">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="aaravpos-slot-section">
          {/* HEADER */}
          <div className="aaravpos-slot-section-header">
            <div className="aaravpos-slot-skeleton-title shimmer" />
            <div className="aaravpos-slot-skeleton-arrow shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
