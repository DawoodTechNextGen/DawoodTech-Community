export function PostCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 rounded-full bg-black/10 dark:bg-white/10" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3.5 w-32 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
          <div className="h-3 w-4/5 rounded bg-black/10 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}
