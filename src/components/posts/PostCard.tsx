import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { PostStatusBadge } from './PostStatusBadge'
import { formatDate, truncate } from '@/lib/utils'
import type { PostWithDetails } from '@/types'

interface PostCardProps {
  post: PostWithDetails
  showStatus?: boolean
}

export async function PostCard({ post, showStatus = false }: PostCardProps) {
  const t = await getTranslations('post')
  const isOgatu = post.category.slug === 'ogatu'
  const preview = isOgatu ? null : truncate(post.body.replace(/[#*`>_~\[\]]/g, ''), 160)

  return (
    <Link href={`/posts/${post.slug}`} className="group block h-full">
      <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="saffron">{post.community.name}</Badge>
          <Badge variant="blue">{post.category.name}</Badge>
          {showStatus && <PostStatusBadge status={post.status} />}
        </div>

        <div className="mb-2">
          <h2 className="text-lg font-semibold text-tx group-hover:text-saffron-700 dark:group-hover:text-saffron-400 line-clamp-2">
            {post.title}
          </h2>
          {post.is_verified && (
            <Tooltip label={t('verifiedDescription')} placement="left" popupClassName="whitespace-normal w-56">
              <span className="mt-1.5 inline-flex cursor-default items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {t('verified')}
              </span>
            </Tooltip>
          )}
        </div>

        {isOgatu ? (
          <p className="mb-4 text-xs font-medium text-saffron-600 dark:text-saffron-400">🤔 Can you guess the answer?</p>
        ) : preview ? (
          <p className="mb-4 text-sm text-tx3 line-clamp-2">{preview}</p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 text-xs text-tx4">
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
