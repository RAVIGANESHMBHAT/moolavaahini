'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { discardPendingEdit } from '@/actions/post.actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function DiscardEditButton({ postId }: { postId: string }) {
  const router = useRouter()
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
        className="w-full rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:w-auto"
      >
        {isPending ? 'Reverting…' : 'Revert to published version'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Revert to published version?"
        message="Your unpublished edits will be permanently lost. The published version will remain unchanged."
        confirmLabel="Yes, revert"
        cancelLabel="Keep editing"
        loading={isPending}
      />
    </div>
  )
}
