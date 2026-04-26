import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg">
              <img src="/icon.svg" alt="ಮೂಲವಾಹಿನಿ" width={28} height={28} className="dark:hidden" />
              <img src="/icon-dark.svg" alt="ಮೂಲವಾಹಿನಿ" width={28} height={28} className="hidden dark:block" />
            </div>
            <span className="text-sm font-semibold text-tx">MoolaVaahini</span>
          </div>
          <p className="text-sm text-tx3">{t('tagline')}</p>
          <div className="flex gap-4">
            <Link href="/havyaka" className="text-sm text-tx3 hover:text-tx2">Havyaka</Link>
            <Link href="/samagra-kannada" className="text-sm text-tx3 hover:text-tx2">Samagra Kannada</Link>
            <Link href="/about" className="text-sm text-tx3 hover:text-tx2">{t('about')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
