export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 animate-pulse">
      <div className="mb-8">
        <div className="mb-1 h-4 w-24 rounded bg-gray-200" />
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
      </div>
      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <aside className="w-52 shrink-0">
          <div className="mb-2 h-3 w-20 rounded bg-gray-200" />
          <div className="flex flex-col gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100" />
            ))}
          </div>
        </aside>
        {/* Posts skeleton */}
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 h-5 w-3/4 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-2/3 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
