import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from '@/components/editor/PostForm'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getTranslations } from 'next-intl/server'
import { CATEGORIES } from '@/lib/categories'
import { COMMUNITIES } from '@/lib/communities'

export const metadata = { title: 'Write' }

interface PageProps {
  searchParams: Promise<{ community?: string }>
}

export default async function NewPostPage({ searchParams }: PageProps) {
  await requireAuth()

  const { community: communitySlug } = await searchParams
  const supabase = await createClient()
  const [t, tNav, tCat, tComm] = await Promise.all([
    getTranslations('editor'),
    getTranslations('nav'),
    getTranslations('categories'),
    getTranslations('communityNames'),
  ])

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

  const lockedCommunity = communitySlug
    ? communities.find((c) => c.slug === communitySlug) ?? null
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:-mx-6 sm:px-6">
        <Breadcrumb items={[
          { label: tNav('home'), href: '/' },
          { label: t('writeNewPost') },
        ]} />
      </div>
      <div className="pt-3">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-tx">{t('newPost')}</h1>
          <p className="mt-1 text-sm text-tx3">{t('newPostDesc')}</p>
        </div>
        <PostForm
          communities={communities}
          categories={categories ?? []}
          mode="create"
          lockedCommunity={lockedCommunity}
        />
      </div>
    </div>
  )
}
