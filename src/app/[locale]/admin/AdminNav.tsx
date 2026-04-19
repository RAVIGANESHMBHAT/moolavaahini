'use client'

import { useState } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface AdminNavProps {
  items: { href: string; label: string }[]
  mobile?: boolean
}

export function AdminNav({ items, mobile = false }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const handleClick = (href: string) => {
    if (pathname === href) return
    setPendingHref(href)
    router.push(href)
  }

  // Clear pending once the real route matches
  const resolvedPending = pendingHref && pathname === pendingHref ? null : pendingHref

  if (mobile) {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {items.map((item) => {
          const isActive = pathname === item.href || resolvedPending === item.href
          return (
            <button
              key={item.href}
              onClick={() => handleClick(item.href)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-saffron-500 bg-saffron-500 text-white'
                  : 'border-border bg-surface text-tx3 hover:border-saffron-300 hover:bg-saffron-50 hover:text-saffron-700 dark:hover:bg-saffron-950 dark:hover:text-saffron-300'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href || resolvedPending === item.href
        return (
          <button
            key={item.href}
            onClick={() => handleClick(item.href)}
            className={cn(
              'w-full rounded-lg border-l-2 px-3 py-2 text-left text-sm font-medium transition-colors',
              isActive
                ? 'border-saffron-500 bg-saffron-50 text-saffron-700 dark:bg-saffron-950 dark:text-saffron-300'
                : 'border-transparent text-tx3 hover:bg-surface2 hover:text-tx'
            )}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
