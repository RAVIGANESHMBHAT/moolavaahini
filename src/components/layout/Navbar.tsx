import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { LocaleSwitcher } from './LocaleSwitcher'
import { WriteButton } from './WriteButton'

export async function Navbar() {
  const user = await getSession()
  let profile = null

  if (user) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron-600 text-white">
            <span className="text-sm font-bold">ಮ</span>
          </div>
          <span className="hidden font-semibold text-gray-900 sm:block">Moolavaahini</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <LocaleSwitcher />

          <Link
            href="/search"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Search"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </Link>

          {user && profile ? (
            <>
              <WriteButton />
              <UserMenu profile={profile} />
            </>
          ) : (
            <GoogleSignInButton compact />
          )}
        </div>
      </div>
    </header>
  )
}
