import { Badge } from '@/components/ui/Badge'
import type { PostStatus } from '@/types'

const statusConfig: Record<PostStatus, { label: string; variant: 'green' | 'yellow' | 'red' | 'default' | 'blue' }> = {
  approved: { label: 'Published', variant: 'green' },
  pending_review: { label: 'Pending Review', variant: 'yellow' },
  draft: { label: 'Draft', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'red' },
}

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const { label, variant } = statusConfig[status]
  return <Badge variant={variant}>{label}</Badge>
}
