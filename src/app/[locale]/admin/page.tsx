import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Admin Overview' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: submittedPosts },
    { count: newPending },
    { count: editPending },
    { count: approvedPosts },
    { count: rejectedPosts },
    { count: totalProfiles },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).neq('status', 'draft'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'approved').not('pending_submitted_at', 'is', null),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const pendingTotal = (newPending ?? 0) + (editPending ?? 0)

  const stats = [
    { label: 'Submitted', value: submittedPosts ?? 0 },
    { label: 'Pending Review', value: pendingTotal, highlight: pendingTotal > 0 },
    { label: 'Published', value: approvedPosts ?? 0 },
    { label: 'Rejected', value: rejectedPosts ?? 0 },
    { label: 'Registered Users', value: totalProfiles ?? 0 },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border p-5 ${stat.highlight ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'}`}
          >
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
