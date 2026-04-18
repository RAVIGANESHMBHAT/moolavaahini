'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface AdminNavProps {
  items: { href: string; label: string }[]
}

export function AdminNav({ items }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-saffron-500 bg-saffron-50 text-saffron-700'
                : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
