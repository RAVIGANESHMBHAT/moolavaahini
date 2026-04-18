'use client'

import { useTransition } from 'react'
import { submitForReview } from '@/actions/post.actions'

export function SubmitButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await submitForReview(postId)
      if (!result.success) {
        alert(result.error)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg bg-saffron-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-saffron-700 disabled:opacity-50"
    >
      {isPending ? 'Submitting…' : 'Submit'}
    </button>
  )
}
