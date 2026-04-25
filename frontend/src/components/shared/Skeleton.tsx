/**
 * Skeleton loading components.
 *
 * Animated placeholders shown while data is loading.
 */

export function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-slate-700/50 rounded ${className}`}
      style={{ width: width ?? "100%", height: height ?? "16px" }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
      <Skeleton width="60%" height="12px" />
      <Skeleton width="40%" height="24px" />
    </div>
  );
}

export function SkeletonGrid({ cols = 6 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${cols} gap-4`}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 3, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <Skeleton width="120px" height="14px" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                width={colIdx === 0 ? "80px" : "60px"}
                height="14px"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
