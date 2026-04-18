export default function UsersLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-40 animate-pulse rounded-lg bg-surface3" />
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface2">
            <tr>
              <th className="px-5 py-3 text-left">
                <div className="h-4 w-10 animate-pulse rounded bg-surface3" />
              </th>
              <th className="px-5 py-3 text-left">
                <div className="h-4 w-12 animate-pulse rounded bg-surface3" />
              </th>
              <th className="px-5 py-3 text-left">
                <div className="h-4 w-8 animate-pulse rounded bg-surface3" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface3" />
                    <div className="h-4 w-28 animate-pulse rounded bg-surface3" />
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-surface3" />
                </td>
                <td className="px-5 py-3">
                  <div className="h-7 w-24 animate-pulse rounded-lg bg-surface3" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
