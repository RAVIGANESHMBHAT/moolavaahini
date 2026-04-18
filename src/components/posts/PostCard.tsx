import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { PostStatusBadge } from './PostStatusBadge'
import { formatDate, truncate } from '@/lib/utils'
import type { PostWithDetails } from '@/types'

interface PostCardProps {
  post: PostWithDetails
  showStatus?: boolean
}

export function PostCard({ post, showStatus = false }: PostCardProps) {
  const isOgatu = post.category.slug === 'ogatu'
  const preview = isOgatu ? null : truncate(post.body.replace(/[#*`>_~\[\]]/g, ''), 160)

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="saffron">{post.community.name}</Badge>
          <Badge variant="blue">{post.category.name}</Badge>
          {showStatus && <PostStatusBadge status={post.status} />}
        </div>

        <h2 className="mb-2 text-lg font-semibold text-tx group-hover:text-saffron-700 dark:group-hover:text-saffron-400 line-clamp-2">
          {post.title}
        </h2>

        {isOgatu ? (
          <p className="mb-4 text-xs font-medium text-saffron-600 dark:text-saffron-400">🤔 Can you guess the answer?</p>
        ) : preview ? (
          <p className="mb-4 text-sm text-tx3 line-clamp-2">{preview}</p>
        ) : null}

        <div className="flex items-center gap-2 text-xs text-tx4">
          {post.author.avatar_url ? (
            <Image
              src={post.author.avatar_url}
              alt={post.author.display_name ?? 'Author'}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-saffron-100 text-[10px] font-semibold text-saffron-700 dark:bg-saffron-900 dark:text-saffron-300">
              {post.author.display_name?.slice(0, 1).toUpperCase() ?? 'U'}
            </div>
          )}
          <span>{post.author.display_name ?? 'Anonymous'}</span>
          <span>·</span>
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        </div>
      </article>
    </Link>
  )
}
