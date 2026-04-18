export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="mb-16 text-center">
        <div className="mx-auto mb-4 h-12 w-64 rounded-lg bg-gray-200" />
        <div className="mx-auto h-5 w-96 rounded bg-gray-200" />
        <div className="mt-8 flex justify-center gap-3">
          <div className="h-10 w-28 rounded-xl bg-gray-200" />
          <div className="h-10 w-28 rounded-xl bg-gray-200" />
        </div>
      </div>

      {/* Communities skeleton */}
      <div className="mb-16">
        <div className="mb-6 h-6 w-36 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-2 h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-48 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="mb-16">
        <div className="mb-6 h-6 w-48 rounded bg-gray-200" />
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-28 rounded-full bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Posts skeleton */}
      <div>
        <div className="mb-6 h-6 w-48 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
