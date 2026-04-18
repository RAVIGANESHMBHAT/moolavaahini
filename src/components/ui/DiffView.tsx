'use client'

import { diffWords } from 'diff'

interface DiffViewProps {
  oldText: string
  newText: string
}

export function DiffView({ oldText, newText }: DiffViewProps) {
  const parts = diffWords(oldText, newText)

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-900">
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <mark key={i} className="rounded bg-green-100 px-0.5 text-green-900 no-underline">
              {part.value}
            </mark>
          )
        }
        if (part.removed) {
          return (
            <del key={i} className="rounded bg-red-100 px-0.5 text-red-800 line-through">
              {part.value}
            </del>
          )
        }
        return <span key={i}>{part.value}</span>
      })}
    </p>
  )
}
