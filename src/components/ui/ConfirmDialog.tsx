'use client'

import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-sm text-gray-600">{message}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          loading={loading}
          className="w-full sm:w-auto"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
