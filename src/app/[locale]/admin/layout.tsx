import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getUserRole } from '@/lib/roles'
import { AdminNav } from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)

  if (role !== 'admin' && role !== 'contributor') {
    redirect('/')
  }

  const isAdmin = role === 'admin'

  const navItems = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/review', label: 'Review Queue' },
    ...(isAdmin ? [{ href: '/admin/users', label: 'Users' }] : []),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex gap-8">
        <aside className="w-48 shrink-0">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Admin
          </p>
          <AdminNav items={navItems} />
        </aside>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
