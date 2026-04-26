'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { COMMUNITIES } from '@/lib/communities'

const COMMUNITY_SLUGS: readonly string[] = COMMUNITIES.map(c => c.slug)
const HIDE_ON = ['/posts/new', '/admin', '/dashboard/edit']

export function FloatingWriteButtonUI() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null

  const segment = pathname.split('/')[1]
  const community = COMMUNITY_SLUGS.includes(segment) ? segment : null
  const href = community ? `/posts/new?community=${community}` : '/posts/new'

  return (
    <Link
      href={href}
      aria-label="Write a post"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-saffron-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-saffron-700 hover:shadow-xl active:scale-95"
    >
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
      <span>{t('write')}</span>
    </Link>
  )
}
