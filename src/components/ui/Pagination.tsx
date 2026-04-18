import Link from 'next/link'

interface PaginationProps {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null

  const prev = page - 1
  const next = page + 1

  // Build window: always show first, last, current ±1
  const pages = new Set([1, totalPages, page, prev, next].filter((p) => p >= 1 && p <= totalPages))
  const sorted = Array.from(pages).sort((a, b) => a - b)

  // Insert ellipsis markers
  const items: (number | 'ellipsis')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push('ellipsis')
    items.push(sorted[i])
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <Link
        href={prev >= 1 ? buildHref(prev) : '#'}
        aria-disabled={page === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
          page === 1
            ? 'pointer-events-none border-gray-100 text-gray-300'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        ‹
      </Link>

      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
              item === page
                ? 'border-saffron-500 bg-saffron-50 text-saffron-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item}
          </Link>
        )
      )}

      <Link
        href={next <= totalPages ? buildHref(next) : '#'}
        aria-disabled={page === totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
          page === totalPages
            ? 'pointer-events-none border-gray-100 text-gray-300'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        ›
      </Link>
    </nav>
  )
}
