import { requireAuth } from '@/lib/auth'
import { getUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { RoleSelector } from '@/components/admin/RoleSelector'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Registered Users' }

export default async function UsersPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') redirect('/admin')

  const [supabase, t] = await Promise.all([
    createClient(),
    getTranslations('admin'),
  ])
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, role, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-tx">{t('registeredUsers')}</h1>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface2">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-tx3">{t('userCol')}</th>
              <th className="px-5 py-3 text-left font-medium text-tx3">{t('joinedCol')}</th>
              <th className="px-5 py-3 text-left font-medium text-tx3">{t('roleCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border3">
            {(profiles ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-xs font-semibold text-saffron-700 dark:bg-saffron-900 dark:text-saffron-300">
                      {p.display_name?.slice(0, 2).toUpperCase() ?? '?'}
                    </div>
                    <span className="font-medium text-tx">
                      {p.display_name ?? <span className="italic text-tx4">{t('noName')}</span>}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-tx3">{formatDate(p.created_at)}</td>
                <td className="px-5 py-3">
                  <RoleSelector userId={p.id} currentRole={p.role} isSelf={p.id === user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
