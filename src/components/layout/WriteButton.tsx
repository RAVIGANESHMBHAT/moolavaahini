'use client'

import { Link, usePathname } from '@/i18n/navigation'

const COMMUNITY_SLUGS = ['havyaka', 'general-kannada']

export function WriteButton() {
  const pathname = usePathname()
  const segment = pathname.split('/')[1]
  const community = COMMUNITY_SLUGS.includes(segment) ? segment : null
  const href = community ? `/posts/new?community=${community}` : '/posts/new'

  return (
    <Link
      href={href}
      className="hidden items-center gap-1.5 rounded-lg bg-saffron-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-saffron-700 sm:flex"
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
      Write
    </Link>
  )
}
