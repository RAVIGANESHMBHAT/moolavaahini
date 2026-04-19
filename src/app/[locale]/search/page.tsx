import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PostList } from '@/components/posts/PostList'
import { SearchBar } from '@/components/posts/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { PostWithDetails } from '@/types'

export const metadata = { title: 'Search' }

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; community?: string; page?: string }>
}

async function SearchResults({ query, category, community, page }: { query: string; category?: string; community?: string; page: number }) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let queryBuilder = supabase
    .from('posts')
    .select(`*, community:communities!posts_community_id_fkey(id, name, slug), category:categories!posts_category_id_fkey(id, name, slug), author:profiles!posts_author_id_fkey(id, display_name, avatar_url)`, { count: 'exact' })
    .eq('status', 'approved')

  if (query.trim()) {
    queryBuilder = queryBuilder.textSearch('search_vector', query.trim(), { type: 'websearch', config: 'english' })
  }

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single()
    if (cat) queryBuilder = queryBuilder.eq('category_id', cat.id)
  }

  if (community) {
    const { data: comm } = await supabase.from('communities').select('id').eq('slug', community).single()
    if (comm) queryBuilder = queryBuilder.eq('community_id', comm.id)
  }

  const { data: posts, count } = await queryBuilder.order('published_at', { ascending: false }).range(from, to)
  const typedPosts = (posts ?? []) as unknown as PostWithDetails[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    if (community) params.set('community', community)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/search${qs ? `?${qs}` : ''}`
  }

  return (
    <>
      <p className="mb-4 text-sm text-tx3">
        {count ?? 0} result{(count ?? 0) !== 1 ? 's' : ''}
        {query ? ` for "${query}"` : ''}
      </p>
      <PostList posts={typedPosts} emptyMessage="No results found. Try a different search." />
      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </>
  )
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '', category, community, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const t = await getTranslations('search')
  const tNav = await getTranslations('nav')

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:-mx-6 sm:px-6">
        <Breadcrumb items={[
          { label: tNav('home'), href: '/' },
          { label: t('title') },
        ]} />
      </div>
      <div className="pt-3">
        <h1 className="mb-6 text-2xl font-bold text-tx">{t('title')}</h1>
        <SearchBar className="mb-8 max-w-xl" />
        <Suspense fallback={<p className="text-sm text-tx3">{t('searching')}</p>}>
          <SearchResults query={q} category={category} community={community} page={page} />
        </Suspense>
      </div>
    </div>
  )
}
