import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PostStatusBadge } from '@/components/posts/PostStatusBadge'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { PostWithDetails } from '@/types'

export async function ReviewQueue() {
  const supabase = await createClient()

  const [{ data: newPosts }, { data: editPosts }] = await Promise.all([
    supabase
      .from('posts')
      .select(`*, community:communities!posts_community_id_fkey(id, name, slug), category:categories!posts_category_id_fkey(id, name, slug), author:profiles!posts_author_id_fkey(id, display_name, avatar_url)`)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true }),
    supabase
      .from('posts')
      .select(`*, community:communities!posts_community_id_fkey(id, name, slug), category:categories!posts_category_id_fkey(id, name, slug), author:profiles!posts_author_id_fkey(id, display_name, avatar_url)`)
      .eq('status', 'approved')
      .not('pending_submitted_at', 'is', null)
      .order('pending_submitted_at', { ascending: true }),
  ])

  const typedNewPosts = (newPosts ?? []) as unknown as PostWithDetails[]
  const typedEditPosts = (editPosts ?? []) as unknown as PostWithDetails[]
  const isEmpty = typedNewPosts.length === 0 && typedEditPosts.length === 0

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed border-border2 bg-surface2 py-16 text-center">
        <p className="text-sm text-tx3">No posts pending review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {typedNewPosts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-tx3">
            New Posts ({typedNewPosts.length})
          </h2>
          <PostList posts={typedNewPosts} />
        </section>
      )}
      {typedEditPosts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-tx3">
            Edit Reviews ({typedEditPosts.length})
          </h2>
          <PostList posts={typedEditPosts} isEdit />
        </section>
      )}
    </div>
  )
}

function PostList({ posts, isEdit = false }: { posts: PostWithDetails[]; isEdit?: boolean }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {posts.map((post) => (
        <div key={post.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              <Badge variant="saffron">{post.community.name}</Badge>
              <Badge variant="blue">{post.category.name}</Badge>
              {isEdit ? <Badge variant="default">Edit</Badge> : <PostStatusBadge status={post.status} />}
            </div>
            <Link href={`/posts/${post.slug}`} className="block truncate text-base font-medium text-tx hover:text-saffron-700 dark:hover:text-saffron-400">
              {isEdit ? (post.pending_title ?? post.title) : post.title}
            </Link>
            <p className="mt-0.5 text-xs text-tx3">
              by {post.author.display_name ?? 'Anonymous'} · {formatDate(post.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
