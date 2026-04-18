'use client'

import { useState, useTransition } from 'react'
import { deletePost } from '@/actions/post.actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    startTransition(async () => { await deletePost(postId) })
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Delete post?"
        message="This cannot be undone. The post and all its content will be permanently deleted."
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        loading={isPending}
      />
    </div>
  )
}
