import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PostList } from '@/components/posts/PostList'
import type { PostWithDetails } from '@/types'

const communities = [
  { name: 'Havyaka', slug: 'havyaka', description: 'Traditions, rituals, and wisdom from the Havyaka community' },
  { name: 'General Kannada', slug: 'general-kannada', description: 'Broader Kannada culture, proverbs, and heritage' },
]

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: posts }] = await Promise.all([
    supabase.from('categories').select('id, name, slug, icon').order('name'),
    supabase
      .from('posts')
      .select(`*, community:communities!posts_community_id_fkey(id, name, slug), category:categories!posts_category_id_fkey(id, name, slug), author:profiles!posts_author_id_fkey(id, display_name, avatar_url)`)
      .eq('status', 'approved')
      .order('published_at', { ascending: false })
      .limit(12),
  ])

  const typedPosts = (posts ?? []) as unknown as PostWithDetails[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-tx sm:text-5xl">ಮೂಲವಾಹಿನಿ</h1>
        <p className="mx-auto max-w-2xl text-lg text-tx3">
          Preserving and sharing the living wisdom of our communities —
          through stories, proverbs, recipes, and rituals.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/posts/new" className="rounded-xl bg-saffron-600 px-6 py-3 text-sm font-semibold text-white hover:bg-saffron-700">
            Contribute
          </Link>
          <Link href="/search" className="rounded-xl border border-border2 bg-surface px-6 py-3 text-sm font-semibold text-tx2 hover:bg-surface2">
            Browse All
          </Link>
        </div>
      </section>

      {/* Communities */}
      <section className="mb-16">
        <h2 className="mb-6 text-xl font-semibold text-tx">Communities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="group rounded-xl border border-border bg-surface p-6 transition-shadow hover:shadow-md">
              <h3 className="mb-2 text-lg font-semibold text-tx group-hover:text-saffron-700 dark:group-hover:text-saffron-400">{c.name}</h3>
              <p className="text-sm text-tx3">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-16">
        <h2 className="mb-6 text-xl font-semibold text-tx">Explore by Category</h2>
        <div className="flex flex-wrap gap-3">
          {(categories ?? []).map((cat) => (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-tx3 hover:border-saffron-300 hover:bg-saffron-50 hover:text-saffron-700 dark:hover:bg-saffron-950 dark:hover:text-saffron-300"
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent posts */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-tx">Recent Contributions</h2>
          <Link href="/search" className="text-sm font-medium text-saffron-600 hover:underline dark:text-saffron-400">
            View all →
          </Link>
        </div>
        <PostList posts={typedPosts} emptyMessage="No content published yet. Be the first to contribute!" />
      </section>
    </div>
  )
}
