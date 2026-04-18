'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { translatePost } from '@/actions/translate.actions'

interface TranslateButtonProps {
  postId: string
  onTranslated: (title: string, body: string) => void
}

export function TranslateButton({ postId, onTranslated }: TranslateButtonProps) {
  const t = useTranslations('post')
  const tErrors = useTranslations('errors')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await translatePost(postId)
      if (result.success) {
        onTranslated(result.title, result.body)
      } else {
        setError(tErrors('translationFailed'))
      }
    })
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('translating')}
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 01-3 3 3 3 0 01-3-3V4zm3 10a7 7 0 00-7 7h14a7 7 0 00-7-7z" clipRule="evenodd" />
            </svg>
            {t('translate')}
          </>
        )}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
