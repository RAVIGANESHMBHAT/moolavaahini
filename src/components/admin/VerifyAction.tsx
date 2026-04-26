'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { verifyPost, unverifyPost } from '@/actions/review.actions'
import { useRouter } from 'next/navigation'

interface VerifyActionProps {
  postId: string
  isVerified: boolean
}

export function VerifyAction({ postId, isVerified }: VerifyActionProps) {
  const router = useRouter()
  const t = useTranslations('admin')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleVerify = () => {
    setError(null)
    startTransition(async () => {
      const result = await verifyPost(postId)
      if (!result.success) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleUnverify = () => {
    setError(null)
    startTransition(async () => {
      const result = await unverifyPost(postId)
      if (!result.success) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-surface2 p-5">
      <h3 className="mb-1 text-sm font-semibold text-tx2">{t('verifySection')}</h3>
      <p className="mb-3 text-xs text-tx3">{t('verifyHint')}</p>

      {error && (
        <div className="mb-3 rounded-lg bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger-text)]">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {isVerified ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            {t('verifiedLabel')}
          </span>
        ) : (
          <span className="text-xs text-tx4">{t('notVerified')}</span>
        )}
        <Button
          variant={isVerified ? 'secondary' : 'primary'}
          onClick={isVerified ? () => setOpen(true) : handleVerify}
          loading={isPending && !open}
        >
          {isVerified ? t('removeVerification') : t('markVerified')}
        </Button>
      </div>

      <ConfirmDialog
        open={open}
        onClose={() => { setOpen(false); setError(null) }}
        onConfirm={handleUnverify}
        title={t('removeVerificationConfirm')}
        message={t('removeVerificationMessage')}
        error={error}
        confirmLabel={t('removeVerificationConfirmLabel')}
        cancelLabel={t('cancel')}
        loading={isPending}
      />
    </div>
  )
}
