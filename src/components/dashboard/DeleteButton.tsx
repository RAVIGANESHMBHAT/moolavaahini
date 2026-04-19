'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { deletePost } from '@/actions/post.actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function DeleteButton({ postId }: { postId: string }) {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      const result = await deletePost(postId)
      if (result.success && result.redirectTo) {
        setOpen(false)
        router.push(result.redirectTo)
      } else {
        setError(result.error ?? 'Delete failed')
      }
    })
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
      >
        {isPending ? t('deleting') : t('delete')}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => { setOpen(false); setError(null) }}
        onConfirm={handleConfirm}
        title={t('deleteConfirm')}
        message={t('deleteMessage')}
        error={error}
        confirmLabel={t('deleteConfirmLabel')}
        cancelLabel={t('cancel')}
        loading={isPending}
      />
    </>
  )
}
