'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTransition } from 'react'

export function LocaleSwitcher() {
  const t = useTranslations('locale')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = locale === 'kn' ? 'en' : 'kn'
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
      aria-label="Switch language"
    >
      {t('toggle')}
    </button>
  )
}
