export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 animate-pulse">
      <div className="mb-4 h-4 w-24 rounded bg-surface3" />
      <div className="mb-6 h-9 w-3/4 rounded bg-surface3" />
      <div className="mb-8 flex gap-3">
        <div className="h-5 w-20 rounded-full bg-surface3" />
        <div className="h-5 w-24 rounded-full bg-surface3" />
        <div className="h-5 w-20 rounded-full bg-surface3" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className={`h-4 rounded bg-surface3 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}
