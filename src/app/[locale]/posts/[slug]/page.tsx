import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { getUserRole } from '@/lib/roles'
import { PostDetail } from '@/components/posts/PostDetail'
import { ReviewActions } from '@/components/admin/ReviewActions'
import { PostStatusBadge } from '@/components/posts/PostStatusBadge'
import { Link } from '@/i18n/navigation'
import { DiffView } from '@/components/ui/DiffView'
import type { PostWithDetails } from '@/types'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title')
    .eq('slug', slug)
    .single()

  return { title: post?.title ?? 'Content' }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      community:communities!posts_community_id_fkey(id, name, slug),
      category:categories!posts_category_id_fkey(id, name, slug),
      author:profiles!posts_author_id_fkey(id, display_name, avatar_url)
    `)
    .eq('slug', slug)
    .single()

  if (!post) notFound()

  const typedPost = post as unknown as PostWithDetails

  // Non-approved posts are only visible to the author and reviewers
  const user = await getSession()
  if (typedPost.status !== 'approved') {
    if (!user) notFound()
    const role = await getUserRole(user.id)
    if (typedPost.author_id !== user.id && role !== 'admin' && role !== 'contributor') {
      notFound()
    }
  }

  const user2 = user ?? null
  const role = user2 ? await getUserRole(user2.id) : null
  const isReviewer = role === 'admin' || role === 'contributor'

  // canReview: new posts in pending_review OR approved posts with a pending edit submitted for review
  const canReview = isReviewer && (
    typedPost.status === 'pending_review' ||
    (typedPost.status === 'approved' && typedPost.pending_submitted_at != null)
  )
  const canEdit = user2 && typedPost.author_id === user2.id && ['draft', 'rejected', 'approved', 'pending_review'].includes(typedPost.status)
  const hasPendingEdit = typedPost.pending_submitted_at != null && typedPost.pending_title != null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Back link + Edit button */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href={`/${typedPost.community.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          {typedPost.community.name}
        </Link>
        {canEdit && (
          <Link
            href={`/dashboard/edit/${typedPost.id}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Status banner (non-approved) */}
      {typedPost.status !== 'approved' && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <PostStatusBadge status={typedPost.status} />
          {typedPost.status === 'rejected' && typedPost.rejection_reason && (
            <span className="text-sm text-gray-600">
              Feedback: {typedPost.rejection_reason}
            </span>
          )}
        </div>
      )}

      {/* Live (approved) content */}
      <PostDetail post={typedPost} isAuthor={!!(user2 && typedPost.author_id === user2.id)} />

      {/* Pending edit panel — only shown to reviewers when an edit is under review */}
      {isReviewer && hasPendingEdit && (
        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <p className="mb-4 text-sm font-semibold text-blue-800">
            Pending Edit — review changes below before approving or rejecting
          </p>
          <div className="space-y-4">
            {typedPost.pending_title !== typedPost.title && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-600">Title</p>
                <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-blue-200">
                  <DiffView oldText={typedPost.title} newText={typedPost.pending_title!} />
                </div>
              </div>
            )}
            {typedPost.pending_body !== typedPost.body && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-600">Content</p>
                <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-blue-200">
                  <DiffView oldText={typedPost.body ?? ''} newText={typedPost.pending_body ?? ''} />
                </div>
              </div>
            )}
            {typedPost.pending_title === typedPost.title && typedPost.pending_body === typedPost.body && (
              <p className="text-sm text-gray-500">No content changes — only community or category was updated.</p>
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
