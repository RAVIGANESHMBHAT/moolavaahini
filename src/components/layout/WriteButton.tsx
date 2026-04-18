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
      className="hidden rounded-lg bg-saffron-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-saffron-700 sm:block"
    >
      Write
    </Link>
  )
}
