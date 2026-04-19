import { Fragment } from 'react'
import { Link } from '@/i18n/navigation'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <svg className="h-3.5 w-3.5 shrink-0 text-tx4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-tx3 transition-colors hover:text-tx"
            >
              {item.label}
            </Link>
          ) : (
            <span className="max-w-[200px] truncate text-tx" title={item.label}>
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
