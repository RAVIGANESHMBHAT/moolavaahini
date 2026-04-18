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
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <p className="text-sm text-gray-500">No riddles yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {posts.length} riddle{posts.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={toggleAll}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          {allRevealed ? 'Hide All' : 'Reveal All'}
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {posts.map((post, i) => {
          const revealed = revealedIds.has(post.id)
          return (
            <div key={post.id} className="px-5 py-4">
              {/* Riddle row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-xs font-medium text-gray-400">
                    {i + 1}.
                  </span>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-saffron-700"
                  >
                    {post.title}
                  </Link>
                </div>
                {post.body ? (
                  <button
                    onClick={() => toggleReveal(post.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      revealed
                        ? 'bg-saffron-100 text-saffron-700 hover:bg-saffron-200'
                        : 'border border-saffron-300 text-saffron-600 hover:bg-saffron-50'
                    }`}
                  >
                    {revealed ? 'Hide' : '🤔 Reveal'}
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-gray-400 italic">No answer</span>
                )}
              </div>

              {/* Answer */}
              {revealed && post.body && (
                <div className="mt-3 ml-6 rounded-lg border border-saffron-100 bg-saffron-50 px-4 py-2.5">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-saffron-600">
                    Answer
                  </p>
                  <p className="text-sm text-gray-800">{post.body}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
