'use client'

import { useTransition } from 'react'
import { clearEditRejection } from '@/actions/post.actions'

export function DismissRejectionButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => clearEditRejection(postId))}
      disabled={isPending}
      className="ml-2 text-xs text-red-400 underline hover:text-red-600 disabled:opacity-50"
    >
      {isPending ? 'Dismissing…' : 'Dismiss'}
    </button>
  )
}
