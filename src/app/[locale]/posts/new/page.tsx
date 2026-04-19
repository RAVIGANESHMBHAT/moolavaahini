import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from '@/components/editor/PostForm'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Write' }

interface PageProps {
  searchParams: Promise<{ community?: string }>
}

export default async function NewPostPage({ searchParams }: PageProps) {
  await requireAuth()

  const { community: communitySlug } = await searchParams
  const supabase = await createClient()
  const t = await getTranslations('editor')
  const tNav = await getTranslations('nav')

  const [{ data: communities }, { data: categories }] = await Promise.all([
    supabase.from('communities').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
  ])

  const lockedCommunity = communitySlug
    ? (communities ?? []).find((c) => c.slug === communitySlug) ?? null
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
          communities={communities ?? []}
          categories={categories ?? []}
          mode="create"
          lockedCommunity={lockedCommunity}
        />
      </div>
    </div>
  )
}
