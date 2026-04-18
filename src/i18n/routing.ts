import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['kn', 'en'] as const,
  defaultLocale: 'kn',
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]
