import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getUserRole } from '@/lib/roles'
import { getTranslations } from 'next-intl/server'
import { AdminNav } from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)

  if (role !== 'admin') {
    redirect('/')
  }

  const t = await getTranslations('admin')

  const navItems = [
    { href: '/admin', label: t('overview') },
    { href: '/admin/review', label: t('reviewQueue') },
    { href: '/admin/users', label: t('users') },
    { href: '/admin/analytics', label: t('analytics') },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Mobile: horizontal nav tabs */}
      <div className="mb-6 md:hidden">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-tx4">{t('title')}</p>
        <AdminNav items={navItems} mobile />
      </div>

      {/* Desktop: sidebar + content */}
      <div className="md:flex md:gap-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-tx4">{t('title')}</p>
          <AdminNav items={navItems} />
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
