import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from '@/components/editor/PostForm'
import type { Post } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Edit Post' }

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()
  if (post.author_id !== user.id) notFound()
  if (!['draft', 'rejected', 'approved', 'pending_review'].includes(post.status)) notFound()

  const [{ data: communities }, { data: categories }] = await Promise.all([
    supabase.from('communities').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
  ])

  const typedPost = post as Post

  // For approved posts with a saved pending edit, pre-fill the form with the pending content
  // so the author continues where they left off rather than re-editing from the live version.
  const formPost: Post = typedPost.status === 'approved' && typedPost.pending_title
    ? {
        ...typedPost,
        title: typedPost.pending_title,
        body: typedPost.pending_body ?? typedPost.body,
        community_id: typedPost.pending_community_id ?? typedPost.community_id,
        category_id: typedPost.pending_category_id ?? typedPost.category_id,
      }
    : typedPost

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
        <p className="mt-1 text-sm text-gray-500">
          {typedPost.status === 'approved'
            ? 'Your changes will be reviewed before replacing the published version.'
            : 'Make changes and save or resubmit for review.'}
        </p>
      </div>
      <PostForm
        communities={communities ?? []}
        categories={categories ?? []}
        post={formPost}
        mode="edit"
        pendingEditPostId={typedPost.status === 'approved' && typedPost.pending_title ? typedPost.id : undefined}
      />
    </div>
  )
}
