'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { deletePost } from '@/actions/post.actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function DeleteButton({ postId }: { postId: string }) {
  const t = useTranslations('dashboard')
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    startTransition(async () => { await deletePost(postId) })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
      >
        {isPending ? t('deleting') : t('delete')}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={t('deleteConfirm')}
        message={t('deleteMessage')}
        confirmLabel={t('deleteConfirmLabel')}
        cancelLabel={t('cancel')}
        loading={isPending}
      />
    </>
  )
}
