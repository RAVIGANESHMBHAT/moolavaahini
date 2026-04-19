import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { NavSearchLink } from './NavSearchLink'
import { Tooltip } from '@/components/ui/Tooltip'

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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Tooltip label="MoolaVaahini" placement="left" popupClassName="sm:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
              {/* Light mode icon */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="Moolavaahini" width={32} height={32} className="scale-[1.25] object-contain dark:hidden" />
              {/* Dark mode icon */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-dark.svg" alt="Moolavaahini" width={32} height={32} className="scale-[1.25] object-contain hidden dark:block" />
            </div>
            <span className="hidden font-semibold text-tx sm:block">MoolaVaahini</span>
          </Link>
        </Tooltip>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />

          <NavSearchLink />

          {user && profile ? (
            <UserMenu profile={profile} />
          ) : (
            <GoogleSignInButton compact />
          )}
        </div>
      </div>
    </header>
  )
}
