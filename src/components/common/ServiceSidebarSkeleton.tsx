import type { JSX } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { X } from "lucide-react";
import { setSidebarOpen } from "@/slices/themeSlice";

interface SkeletonBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

const SkeletonBlock = ({ className, style }: SkeletonBlockProps): JSX.Element => (
  <div className={`aaravpos-skeleton-block ${className || ""}`} style={style}>
    <div className="aaravpos-skeleton-shimmer" />
  </div>
);

export default function ServiceSidebarSkeleton(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div className="aaravpos-sidebar-skeleton">
      <div className="skeleton-header">
        {/* "Your Order" title skeleton */}
        <SkeletonBlock className="aaravpos-skeleton-title" />
        <button className="aaravpos-sidebar-close-btn" onClick={() => dispatch(setSidebarOpen(false))}>
          <X size={18} />
        </button>
      </div>
      {/* Outlet Name subtitle skeleton */}
      <div className="aaravpos-skeleton-subtitle-wrapper">
        <SkeletonBlock className="aaravpos-skeleton-subtitle" />
      </div>
      
      {/* Selected services list skeleton */}
      <div className="aaravpos-skeleton-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={`aaravpos-skeleton-item ${index !== 2 ? "aaravpos-skeleton-border" : ""
              }`}
          >
            {/* Service name & time skeleton */}
            <SkeletonBlock className="aaravpos-skeleton-item-name" />
            {/* Service price skeleton */}
            <SkeletonBlock className="aaravpos-skeleton-item-price" />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="aaravpos-divider aaravpos-skeleton-divider" />

      {/* Subtotal row skeleton */}
      <div className="aaravpos-skeleton-subtotal-row">
        <SkeletonBlock className="aaravpos-skeleton-subtotal-label" />
        <SkeletonBlock className="aaravpos-skeleton-subtotal-val" />
      </div>

      {/* Action button skeleton */}
      <SkeletonBlock className="aaravpos-skeleton-button" />
    </div>
  );
}
