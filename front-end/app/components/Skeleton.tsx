export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-ink-100 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent after:animate-skeleton-sweep ${className}`}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white transition-[box-shadow,border-color,transform] duration-200 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>

      <div className="border-t border-ink-100 mt-6 flex gap-6 pt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-ink-100 bg-white transition-[box-shadow,border-color,transform] duration-200 p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-5 w-3/4" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>
          <Skeleton className="mt-5 h-4 w-32" />
        </div>
      ))}
    </div>
  );
}
