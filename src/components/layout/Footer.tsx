import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-600 text-white">
              <span className="text-xs font-bold">ಮ</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Moolavaahini</span>
          </div>
          <p className="text-sm text-gray-500">{t('tagline')}</p>
          <div className="flex gap-4">
            <Link href="/havyaka" className="text-sm text-gray-500 hover:text-gray-700">Havyaka</Link>
            <Link href="/general-kannada" className="text-sm text-gray-500 hover:text-gray-700">General Kannada</Link>
            <Link href="/about" className="text-sm text-gray-500 hover:text-gray-700">{t('about')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
