'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { clearEditRejection } from '@/actions/post.actions'

export function DismissRejectionButton({ postId }: { postId: string }) {
  const t = useTranslations('dashboard')
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => { await clearEditRejection(postId) })}
      disabled={isPending}
      className="ml-2 text-xs text-red-400 underline hover:text-red-600 disabled:opacity-50"
    >
      {isPending ? t('dismissing') : t('dismiss')}
    </button>
  )
}
