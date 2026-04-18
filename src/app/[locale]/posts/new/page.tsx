import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from '@/components/editor/PostForm'

export const metadata = { title: 'Write' }

interface PageProps {
  searchParams: Promise<{ community?: string }>
}

export default async function NewPostPage({ searchParams }: PageProps) {
  await requireAuth()

  const { community: communitySlug } = await searchParams
  const supabase = await createClient()

  const [{ data: communities }, { data: categories }] = await Promise.all([
    supabase.from('communities').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
  ])

  const lockedCommunity = communitySlug
    ? (communities ?? []).find((c) => c.slug === communitySlug) ?? null
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Post</h1>
        <p className="mt-1 text-sm text-gray-500">
          Write your contribution. Save as draft or submit for review.
        </p>
      </div>
      <PostForm
        communities={communities ?? []}
        categories={categories ?? []}
        mode="create"
        lockedCommunity={lockedCommunity}
      />
    </div>
  )
}
