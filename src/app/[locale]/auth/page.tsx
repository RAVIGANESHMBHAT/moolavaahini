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
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron-600 text-white">
            <span className="text-2xl font-bold">ಮ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('welcome')}</h1>
          <p className="mt-2 text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <GoogleSignInButton />

        <p className="mt-6 text-center text-xs text-gray-400">{t('disclaimer')}</p>
      </div>
    </div>
  )
}
