export default function ReviewLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-36 animate-pulse rounded-lg bg-surface3" />
      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/3 animate-pulse rounded bg-surface3" />
              <div className="h-3.5 w-1/3 animate-pulse rounded bg-surface3" />
            </div>
            <div className="flex shrink-0 gap-2">
              <div className="h-8 w-20 animate-pulse rounded-lg bg-surface3" />
              <div className="h-8 w-20 animate-pulse rounded-lg bg-surface3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
