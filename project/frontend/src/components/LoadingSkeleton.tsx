export function LoadingSkeleton({ variant }: { variant: "catchup" | "watchlist" | "detail" | "preferences" }) {
  const block = "animate-pulse bg-surface-elevated rounded-xl";
  if (variant === "watchlist") {
    return (
      <div className="space-y-space-xs">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${block} h-20`} />
        ))}
      </div>
    );
  }
  if (variant === "detail") {
    return (
      <div className="space-y-space-lg">
        <div className={`${block} h-40`} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className={`${block} h-64 lg:col-span-7`} />
          <div className={`${block} h-64 lg:col-span-5`} />
        </div>
        <div className={`${block} h-80`} />
      </div>
    );
  }
  if (variant === "preferences") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
        <div className={`${block} h-96 lg:col-span-6`} />
        <div className={`${block} h-96 lg:col-span-6`} />
      </div>
    );
  }
  return (
    <div className="space-y-space-lg">
      <div className="grid grid-cols-3 gap-space-sm">
        <div className={`${block} h-24`} />
        <div className={`${block} h-24`} />
        <div className={`${block} h-24`} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`${block} h-40`} />
      ))}
    </div>
  );
}
