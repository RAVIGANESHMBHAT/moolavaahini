import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { getUserRole } from '@/lib/roles'
import { PostDetail } from '@/components/posts/PostDetail'
import { ReviewActions } from '@/components/admin/ReviewActions'
import { PostStatusBadge } from '@/components/posts/PostStatusBadge'
import { Link } from '@/i18n/navigation'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { DiffView } from '@/components/ui/DiffView'
import type { PostWithDetails } from '@/types'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase.from('posts').select('title').eq('slug', slug).single()
  return { title: post?.title ?? 'Content' }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select(`*, community:communities!posts_community_id_fkey(id, name, slug), category:categories!posts_category_id_fkey(id, name, slug), author:profiles!posts_author_id_fkey(id, display_name, avatar_url)`)
    .eq('slug', slug)
    .single()

  if (!post) notFound()

  const typedPost = post as unknown as PostWithDetails

  const user = await getSession()
  if (typedPost.status !== 'approved') {
    if (!user) notFound()
    const role = await getUserRole(user.id)
    if (typedPost.author_id !== user.id && role !== 'admin') notFound()
  }

  const user2 = user ?? null
  const role = user2 ? await getUserRole(user2.id) : null
  const isReviewer = role === 'admin'

  const canReview = isReviewer && (
    typedPost.status === 'pending_review' ||
    (typedPost.status === 'approved' && typedPost.pending_submitted_at != null)
  )
  const canEdit = user2 && typedPost.author_id === user2.id && ['draft', 'rejected', 'approved', 'pending_review'].includes(typedPost.status)
  const hasPendingEdit = typedPost.pending_submitted_at != null && typedPost.pending_title != null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: typedPost.community.name, href: `/${typedPost.community.slug}` },
          { label: typedPost.category.name, href: `/${typedPost.community.slug}/${typedPost.category.slug}` },
          { label: typedPost.title },
        ]} />
        {canEdit && (
          <Link href={`/dashboard/edit/${typedPost.id}`} className="shrink-0 rounded-lg border border-border2 px-3 py-1.5 text-xs font-medium text-tx2 hover:bg-surface2">
            Edit
          </Link>
        )}
      </div>

      {/* Status banner */}
      {typedPost.status !== 'approved' && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--color-warn-border)] bg-[var(--color-warn-bg)] px-4 py-3">
          <PostStatusBadge status={typedPost.status} />
          {typedPost.status === 'rejected' && typedPost.rejection_reason && (
            <span className="text-sm text-tx2">Feedback: {typedPost.rejection_reason}</span>
          )}
        </div>
      )}

      <PostDetail post={typedPost} isAuthor={!!(user2 && typedPost.author_id === user2.id)} />

      {/* Pending edit panel */}
      {isReviewer && hasPendingEdit && (
        <div className="mt-10 rounded-xl border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-6">
          <p className="mb-4 text-sm font-semibold text-[var(--color-info-text)]">
            Pending Edit — review changes below before approving or rejecting
          </p>
          <div className="space-y-4">
            {typedPost.pending_title !== typedPost.title && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-info-text)]">Title</p>
                <div className="rounded-lg bg-surface px-3 py-2 ring-1 ring-[var(--color-info-border)]">
                  <DiffView oldText={typedPost.title} newText={typedPost.pending_title!} />
                </div>
              </div>
            )}
            {typedPost.pending_body !== typedPost.body && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-info-text)]">Content</p>
                <div className="rounded-lg bg-surface px-3 py-2 ring-1 ring-[var(--color-info-border)]">
                  <DiffView oldText={typedPost.body ?? ''} newText={typedPost.pending_body ?? ''} />
                </div>
              </div>
            )}
            {typedPost.pending_title === typedPost.title && typedPost.pending_body === typedPost.body && (
              <p className="text-sm text-tx3">No content changes — only community or category was updated.</p>
            )}
          </div>
        </div>
      )}

      {canReview && (
        <div className="mt-8">
          <ReviewActions postId={typedPost.id} postUpdatedAt={typedPost.updated_at} />
        </div>
      )}
    </div>
  )
}
