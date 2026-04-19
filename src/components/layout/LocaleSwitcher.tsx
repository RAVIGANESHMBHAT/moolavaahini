'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTransition, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

const locales = [
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'en', label: 'English' },
]

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function select(code: string) {
    if (code === locale) { setOpen(false); return }
    setOpen(false)
    startTransition(() => {
      router.replace(pathname, { locale: code })
    })
  }

  return (
    <div ref={ref} className="relative flex items-center">
      <Tooltip label={t('language')} placement="right">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={isPending}
          aria-label="Switch language"
          className={cn(
            'rounded-lg p-2 text-tx3 transition-colors hover:bg-surface2 hover:text-tx2 disabled:opacity-50',
            open && 'bg-surface2 text-tx2'
          )}
        >
          {/* Translate icon (A ↔ 文 style) */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
          </svg>
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-border bg-surface py-1 shadow-lg">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              className={cn(
                'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface2',
                l.code === locale ? 'font-semibold text-saffron-600 dark:text-saffron-400' : 'text-tx'
              )}
            >
              {l.label}
              {l.code === locale && (
                <svg className="h-4 w-4 shrink-0 text-saffron-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
