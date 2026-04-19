import { PostCard } from './PostCard'
import type { PostWithDetails } from '@/types'

interface PostListProps {
  posts: PostWithDetails[]
  showStatus?: boolean
  emptyMessage?: string
}

export function PostList({ posts, showStatus, emptyMessage = 'No content found.' }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border2 bg-surface2 py-16 text-center">
        <p className="text-sm text-tx3">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showStatus={showStatus} />
      ))}
    </div>
  )
}
