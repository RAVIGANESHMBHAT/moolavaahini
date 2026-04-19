import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PostList } from '@/components/posts/PostList'
import { Sidebar } from '@/components/layout/Sidebar'
import { Pagination } from '@/components/ui/Pagination'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { PostWithDetails } from '@/types'

const PAGE_SIZE = 20

interface PageProps {
  params: Promise<{ community: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { community } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('communities').select('name').eq('slug', community).single()
  if (!data) return {}
  return { title: `${data.name} – Cultural Content` }
}

export default async function CommunityPage({ params, searchParams }: PageProps) {
  const { community } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [supabase, tNav, tCommunity] = await Promise.all([
    createClient(),
    getTranslations('nav'),
    getTranslations('community'),
  ])

  const [{ data: communityData }, { data: categories }] = await Promise.all([
    supabase.from('communities').select('id, name').eq('slug', community).single(),
    supabase.from('categories').select('name, slug').order('name'),
  ])

  if (!communityData) notFound()

  const { data: posts, count } = await supabase
    .from('posts')
    .select(`*, community:communities!posts_community_id_fkey(id, name, slug), category:categories!posts_category_id_fkey(id, name, slug), author:profiles!posts_author_id_fkey(id, display_name, avatar_url)`, { count: 'exact' })
    .eq('status', 'approved')
    .eq('community_id', communityData.id)
    .order('published_at', { ascending: false })
    .range(from, to)

  const typedPosts = (posts ?? []) as unknown as PostWithDetails[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const buildHref = (p: number) => p === 1 ? `/${community}` : `/${community}?page=${p}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Breadcrumb items={[
        { label: tNav('home'), href: '/' },
        { label: communityData.name },
      ]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-tx">{communityData.name}</h1>
        <p className="mt-2 text-tx3">{tCommunity('piecesOfContent', { count: count ?? 0 })}</p>
      </div>

      <div className="md:flex md:gap-8">
        <Sidebar community={community} categories={categories ?? []} />
        <div className="flex-1">
          <PostList posts={typedPosts} emptyMessage={tCommunity('noContent', { name: communityData.name })} />
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </div>
    </div>
  )
}
