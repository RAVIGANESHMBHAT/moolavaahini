import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostList } from '@/components/posts/PostList'
import { OgatuTable } from '@/components/posts/OgatuTable'
import { Sidebar } from '@/components/layout/Sidebar'
import { Pagination } from '@/components/ui/Pagination'
import type { PostWithDetails } from '@/types'

const PAGE_SIZE = 20

interface PageProps {
  params: Promise<{ community: string; category: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { community, category } = await params
  const supabase = await createClient()

  const [{ data: communityData }, { data: categoryData }] = await Promise.all([
    supabase.from('communities').select('name').eq('slug', community).single(),
    supabase.from('categories').select('name').eq('slug', category).single(),
  ])

  if (!communityData || !categoryData) return {}
  return { title: `${categoryData.name} – ${communityData.name}` }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { community, category } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const [{ data: communityData }, { data: categoryData }, { data: categories }] = await Promise.all([
    supabase.from('communities').select('id, name').eq('slug', community).single(),
    supabase.from('categories').select('id, name, slug').eq('slug', category).single(),
    supabase.from('categories').select('name, slug').order('name'),
  ])

  if (!communityData || !categoryData) notFound()

  const { data: posts, count } = await supabase
    .from('posts')
    .select(`*, community:communities!posts_community_id_fkey(id, name, slug), category:categories!posts_category_id_fkey(id, name, slug), author:profiles!posts_author_id_fkey(id, display_name, avatar_url)`, { count: 'exact' })
    .eq('status', 'approved')
    .eq('community_id', communityData.id)
    .eq('category_id', categoryData.id)
    .order('published_at', { ascending: false })
    .range(from, to)

  const typedPosts = (posts ?? []) as unknown as PostWithDetails[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const buildHref = (p: number) => p === 1 ? `/${community}/${category}` : `/${community}/${category}?page=${p}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="mb-1 text-sm text-tx3">{communityData.name}</p>
        <h1 className="text-3xl font-bold text-tx">{categoryData.name}</h1>
        <p className="mt-2 text-tx3">{count ?? 0} piece{(count ?? 0) !== 1 ? 's' : ''} of content</p>
      </div>

      <div className="md:flex md:gap-8">
        <Sidebar community={community} categories={categories ?? []} />
        <div className="flex-1">
          {categoryData.slug === 'ogatu' ? (
            <>
              <OgatuTable posts={typedPosts} />
              <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
            </>
          ) : (
            <>
              <PostList posts={typedPosts} emptyMessage={`No ${categoryData.name} content from ${communityData.name} yet.`} />
              <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
