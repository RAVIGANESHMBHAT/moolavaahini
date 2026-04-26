import type { Metadata } from 'next'
import { Inter, Noto_Sans_Kannada } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import '../globals.css'
import { ThemeProvider } from '@/lib/theme'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FloatingWriteButton } from '@/components/layout/FloatingWriteButton'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const notoSansKannada = Noto_Sans_Kannada({
  subsets: ['kannada'],
  variable: '--font-noto-kannada',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'MoolaVaahini - Cultural Knowledge Archive',
    template: '%s | MoolaVaahini',
  },
  description:
    'Preserving and sharing cultural knowledge from Havyaka and Kannada communities.',
  icons: {
    icon: '/icon.svg',
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} className={`${inter.variable} ${notoSansKannada.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <div className="print:hidden"><Navbar /></div>
            <main className="flex-1">{children}</main>
            <div className="print:hidden"><FloatingWriteButton /></div>
            <div className="print:hidden"><Footer /></div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
