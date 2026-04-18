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
      .select(`
        *,
        community:communities!posts_community_id_fkey(id, name, slug),
        category:categories!posts_category_id_fkey(id, name, slug),
        author:profiles!posts_author_id_fkey(id, display_name, avatar_url)
      `)
      .eq('status', 'approved')
      .order('published_at', { ascending: false })
      .limit(12),
  ])

  const typedPosts = (posts ?? []) as unknown as PostWithDetails[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
          ಮೂಲವಾಹಿನಿ
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Preserving and sharing the living wisdom of our communities —
          through stories, proverbs, recipes, and rituals.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/posts/new"
            className="rounded-xl bg-saffron-600 px-6 py-3 text-sm font-semibold text-white hover:bg-saffron-700"
          >
            Contribute
          </Link>
          <Link
            href="/search"
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Browse All
          </Link>
        </div>
      </section>

      {/* Communities */}
      <section className="mb-16">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Communities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-saffron-700">
                {c.name}
              </h3>
              <p className="text-sm text-gray-500">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-16">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Explore by Category</h2>
        <div className="flex flex-wrap gap-3">
          {(categories ?? []).map((cat) => (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-saffron-300 hover:bg-saffron-50 hover:text-saffron-700"
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
          <h2 className="text-xl font-semibold text-gray-900">Recent Contributions</h2>
          <Link href="/search" className="text-sm font-medium text-saffron-600 hover:underline">
            View all →
          </Link>
        </div>
        <PostList
          posts={typedPosts}
          emptyMessage="No content published yet. Be the first to contribute!"
        />
      </section>
    </div>
  )
}
