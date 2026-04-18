import { requireAuth } from '@/lib/auth'
import { getUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoleSelector } from '@/components/admin/RoleSelector'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Registered Users' }

export default async function UsersPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') redirect('/admin')

  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, role, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Registered Users</h1>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-500">User</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Joined</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(profiles ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-xs font-semibold text-saffron-700">
                      {p.display_name?.slice(0, 2).toUpperCase() ?? '?'}
                    </div>
                    <span className="font-medium text-gray-900">
                      {p.display_name ?? <span className="italic text-gray-400">No name</span>}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500">{formatDate(p.created_at)}</td>
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
