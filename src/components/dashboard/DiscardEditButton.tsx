'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { discardPendingEdit } from '@/actions/post.actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function DiscardEditButton({ postId }: { postId: string }) {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await discardPendingEdit(postId)
      if (!result.success) {
        setError(result.error ?? 'Something went wrong')
        setOpen(false)
      } else {
        router.push('/dashboard')
      }
    })
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="w-full rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950/40 sm:w-auto"
      >
        {isPending ? t('reverting') : t('revert')}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={t('revertConfirm')}
        message={t('revertMessage')}
        confirmLabel={t('revertConfirmLabel')}
        cancelLabel={t('keepEditing')}
        loading={isPending}
      />
    </div>
  )
}
