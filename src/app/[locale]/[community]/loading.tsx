export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 animate-pulse">
      <div className="mb-8">
        <div className="mb-1 h-4 w-24 rounded bg-surface3" />
        <div className="h-8 w-48 rounded bg-surface3" />
        <div className="mt-2 h-4 w-32 rounded bg-surface2" />
      </div>

      {/* Mobile pill tabs skeleton */}
      <div className="mb-4 flex gap-2 md:hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-surface3" />
        ))}
      </div>

      <div className="md:flex md:gap-8">
        {/* Sidebar skeleton — desktop only */}
        <aside className="hidden w-48 shrink-0 md:block">
          <div className="mb-2 h-3 w-20 rounded bg-surface3" />
          <div className="flex flex-col gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-surface2" />
            ))}
          </div>
        </aside>

        {/* Posts skeleton */}
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 h-5 w-3/4 rounded bg-surface3" />
              <div className="mb-2 h-4 w-full rounded bg-surface2" />
              <div className="h-4 w-2/3 rounded bg-surface2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
