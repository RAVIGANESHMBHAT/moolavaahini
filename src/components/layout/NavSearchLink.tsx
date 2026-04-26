'use client'

import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Tooltip } from '@/components/ui/Tooltip'
import { COMMUNITIES } from '@/lib/communities'

const KNOWN_COMMUNITIES = COMMUNITIES.map(c => c.slug)

export function NavSearchLink() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const community = KNOWN_COMMUNITIES.find(
    (c) => pathname === `/${c}` || pathname.startsWith(`/${c}/`)
  )
  const href = community ? `/search?community=${community}` : '/search'

  return (
    <Tooltip label={t('search')} placement="right">
      <Link
        href={href}
        className="rounded-lg p-2 text-tx3 hover:bg-surface2 hover:text-tx2"
        aria-label="Search"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
      </Link>
    </Tooltip>
  )
}
