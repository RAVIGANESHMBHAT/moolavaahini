import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getSession } from '@/lib/auth'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

export const metadata = { title: 'Sign In' }

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getSession()
  if (user) redirect('/')

  const { error } = await searchParams
  const t = await getTranslations('auth')

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
            <img src="/icon.svg" alt="Moolavaahini" width={64} height={64} className="dark:hidden" />
            <img src="/icon-dark.svg" alt="Moolavaahini" width={64} height={64} className="hidden dark:block" />
          </div>
          <h1 className="text-2xl font-bold text-tx">{t('welcome')}</h1>
          <p className="mt-2 text-sm text-tx3">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        <GoogleSignInButton />

        <p className="mt-6 text-center text-xs text-tx4">{t('disclaimer')}</p>
      </div>
    </div>
  )
}
