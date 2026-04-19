'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/Badge'
import type { PostStatus } from '@/types'

const statusVariant: Record<PostStatus, 'green' | 'yellow' | 'red' | 'default' | 'blue'> = {
  approved: 'green',
  pending_review: 'yellow',
  draft: 'default',
  rejected: 'red',
}

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const t = useTranslations('status')
  return <Badge variant={statusVariant[status]}>{t(status)}</Badge>
}
