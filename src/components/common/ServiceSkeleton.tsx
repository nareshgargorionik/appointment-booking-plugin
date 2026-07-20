


import type { JSX } from "react";

interface SkeletonBlockProps {
    className?: string;
    style?: React.CSSProperties;
}

const SkeletonBlock = ({ className, style }: SkeletonBlockProps): JSX.Element => (
    <div className={`aaravpos-skeleton-block ${className || ""}`} style={style}>
        <div className="aaravpos-skeleton-shimmer" />
    </div>
);

export default function ServiceSkeletonCard(): JSX.Element {
    return (
        <div className="aaravpos-service-card" style={{ cursor: "default", pointerEvents: "none" }}>
            {/* Title skeleton */}
            <SkeletonBlock
                style={{
                    height: "16px",
                    width: "70%",
                    marginTop: "12px",
                    marginBottom: "4px"
                }}
            />

            {/* Description skeleton */}
            <SkeletonBlock
                style={{
                    height: "12px",
                    width: "95%",
                    margin: "8px 0px"
                }}
            />

            {/* Price/Duration Row skeleton */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "12px",
                    marginBottom: "8px"
                }}
            >
                {/* Duration skeleton (left) */}
                <SkeletonBlock style={{ height: "14px", width: "40px" }} />
                {/* Price skeleton (right) */}
                <SkeletonBlock style={{ height: "14px", width: "50px" }} />
            </div>
        </div>
    );
}
