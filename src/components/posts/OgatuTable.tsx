'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PostWithDetails } from '@/types'

export function OgatuTable({ posts }: { posts: PostWithDetails[] }) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const allRevealed = posts.every((p) => revealedIds.has(p.id))

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allRevealed) {
      setRevealedIds(new Set())
    } else {
      setRevealedIds(new Set(posts.map((p) => p.id)))
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border2 bg-surface2 py-16 text-center">
        <p className="text-sm text-tx3">No riddles yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-tx3">
          {posts.length} riddle{posts.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={toggleAll}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-tx3 hover:bg-surface2"
        >
          {allRevealed ? 'Hide All' : 'Reveal All'}
        </button>
      </div>

      <div className="divide-y divide-border3">
        {posts.map((post, i) => {
          const revealed = revealedIds.has(post.id)
          return (
            <div key={post.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-xs font-medium text-tx4">
                    {i + 1}.
                  </span>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-sm font-medium text-tx hover:text-saffron-700 dark:hover:text-saffron-400"
                  >
                    {post.title}
                  </Link>
                </div>
                {post.body ? (
                  <button
                    onClick={() => toggleReveal(post.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      revealed
                        ? 'bg-saffron-100 text-saffron-700 hover:bg-saffron-200 dark:bg-saffron-900/40 dark:text-saffron-300'
                        : 'border border-saffron-300 text-saffron-600 hover:bg-saffron-50 dark:border-saffron-700 dark:hover:bg-saffron-950/40'
                    }`}
                  >
                    {revealed ? 'Hide' : '🤔 Reveal'}
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-tx4 italic">No answer</span>
                )}
              </div>

              {revealed && post.body && (
                <div className="mt-3 ml-6 rounded-lg border border-saffron-100 bg-saffron-50 px-4 py-2.5 dark:border-saffron-900 dark:bg-saffron-950/40">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-saffron-600 dark:text-saffron-400">
                    Answer
                  </p>
                  <p className="text-sm text-tx">{post.body}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
