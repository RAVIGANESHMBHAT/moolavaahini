'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface SidebarProps {
  community?: string
  categories: Pick<Category, 'name' | 'slug'>[]
}

export function Sidebar({ community, categories }: SidebarProps) {
  const pathname = usePathname()
  const base = community ? `/${community}` : ''

  const allItems = [
    { name: 'All', slug: '' },
    ...categories,
  ]

  return (
    <aside className="w-52 shrink-0">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Categories
      </p>
      <nav className="flex flex-col gap-0.5">
        {allItems.map((cat) => {
          const href = cat.slug ? `${base}/${cat.slug}` : base || '/'
          const isActive = pathname === href

          return (
            <Link
              key={cat.slug}
              href={href}
              className={cn(
                'rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-saffron-500 bg-saffron-50 text-saffron-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {cat.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
