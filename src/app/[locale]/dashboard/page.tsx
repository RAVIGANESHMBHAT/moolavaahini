import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { PostStatusBadge } from '@/components/posts/PostStatusBadge'
import { PostActionsMenu } from '@/components/dashboard/PostActionsMenu'
import { DeleteButton } from '@/components/dashboard/DeleteButton'
import { SubmitButton } from '@/components/dashboard/SubmitButton'
import { DismissRejectionButton } from '@/components/dashboard/DismissRejectionButton'
import { formatDate } from '@/lib/utils'
import type { Post } from '@/types'

export const metadata = { title: 'My Posts' }

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()
  const t = await getTranslations('dashboard')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, community:communities!posts_community_id_fkey(name), category:categories!posts_category_id_fkey(name)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const typedPosts = (posts ?? []) as unknown as (Post & { community: { name: string }; category: { name: string } })[]

  const grouped = {
    draft: typedPosts.filter((p) => p.status === 'draft'),
    pending_review: typedPosts.filter((p) => p.status === 'pending_review'),
    approved: typedPosts.filter((p) => p.status === 'approved'),
    rejected: typedPosts.filter((p) => p.status === 'rejected'),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tx">{t('title')}</h1>
      </div>

      {typedPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border2 bg-surface2 py-20 text-center">
          <p className="mb-4 text-sm text-tx3">{t('empty')}</p>
          <Link href="/posts/new" className="rounded-lg bg-saffron-600 px-4 py-2 text-sm font-medium text-white hover:bg-saffron-700">
            {t('startWriting')}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.entries(grouped) as [keyof typeof grouped, typeof typedPosts][])
            .filter(([, items]) => items.length > 0)
            .map(([status, items]) => (
              <section key={status}>
                <div className="mb-3 flex items-center gap-2">
                  <PostStatusBadge status={status} />
                  <span className="text-sm text-tx3">({items.length})</span>
                </div>
                <div className="divide-y divide-border rounded-xl border border-border bg-surface">
                  {items.map((post) => (
                    <div key={post.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <Link href={`/posts/${post.slug}`} className="block truncate font-medium text-tx hover:text-saffron-700 dark:hover:text-saffron-400">
                          {post.title}
                        </Link>
                        <p className="text-xs text-tx3">
                          {post.community.name} · {post.category.name} · {formatDate(post.created_at)}
                        </p>
                        {post.status === 'rejected' && post.rejection_reason && (
                          <p className="mt-1 text-xs text-red-500">{t('feedback')} {post.rejection_reason}</p>
                        )}
                        {post.status === 'approved' && post.pending_submitted_at && (
                          <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">{t('editUnderReview')}</p>
                        )}
                        {post.status === 'approved' && post.pending_title && !post.pending_submitted_at && (
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('unpublishedEdit')}</p>
                        )}
                        {post.status === 'approved' && post.rejection_reason && !post.pending_title && (
                          <p className="mt-1 text-xs text-red-500">
                            {t('editRejected')} {post.rejection_reason}
                            <DismissRejectionButton postId={post.id} />
                          </p>
                        )}
                      </div>
                      <PostActionsMenu>
                        {['draft', 'rejected', 'approved', 'pending_review'].includes(post.status) && (
                          <Link href={`/dashboard/edit/${post.id}`} className="rounded-lg border border-border2 px-3 py-1.5 text-xs font-medium text-tx2 hover:bg-surface2">
                            {t('edit')}
                          </Link>
                        )}
                        {['draft', 'rejected'].includes(post.status) && <SubmitButton postId={post.id} />}
                        <DeleteButton postId={post.id} />
                      </PostActionsMenu>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  )
}
