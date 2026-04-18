export default function AdminLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-32 animate-pulse rounded-lg bg-surface3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <div className="h-9 w-12 animate-pulse rounded bg-surface3" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded bg-surface3" />
          </div>
        ))}
      </div>
    </div>
  )
}
