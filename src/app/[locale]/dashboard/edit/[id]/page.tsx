import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { PostForm } from '@/components/editor/PostForm'
import { DeleteButton } from '@/components/dashboard/DeleteButton'
import { Link } from '@/i18n/navigation'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CATEGORIES } from '@/lib/categories'
import { COMMUNITIES } from '@/lib/communities'
import type { Post } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Edit Post' }

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()
  const supabase = await createClient()
  const [t, tDash, tCat, tComm] = await Promise.all([
    getTranslations('editor'),
    getTranslations('dashboard'),
    getTranslations('categories'),
    getTranslations('communityNames'),
  ])

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()
  if (post.author_id !== user.id) notFound()
  if (!['draft', 'rejected', 'approved', 'pending_review'].includes(post.status)) notFound()

  const [{ data: communityRows }, { data: categoryRows }] = await Promise.all([
    supabase.from('communities').select('id, slug').order('name'),
    supabase.from('categories').select('id, slug').order('name'),
  ])

  const communities = (communityRows ?? []).map(row => {
    const def = COMMUNITIES.find(c => c.slug === row.slug)
    return { ...row, name: def ? tComm(def.nameKey) : row.slug, description: null, created_at: '' }
  })

  const categories = (categoryRows ?? []).map(row => {
    const def = CATEGORIES.find(c => c.slug === row.slug)
    return { ...row, name: def ? tCat(def.nameKey) : row.slug, icon: def?.icon ?? '', created_at: '' }
  })

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
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:-mx-6 sm:px-6">
        <Breadcrumb items={[
          { label: tDash('title'), href: '/dashboard' },
          { label: t('editPost') },
        ]} />
      </div>
      <div className="pt-3">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-tx">{t('editPost')}</h1>
              <p className="mt-1 text-sm text-tx3">
                {typedPost.status === 'approved'
                  ? t('editPostDescApproved')
                  : t('editPostDesc')}
              </p>
            </div>
            <DeleteButton postId={typedPost.id} />
          </div>
        </div>
        <PostForm
          communities={communities}
          categories={categories}
          post={formPost}
          mode="edit"
          pendingEditPostId={typedPost.status === 'approved' && typedPost.pending_title ? typedPost.id : undefined}
        />
      </div>
    </div>
  )
}
