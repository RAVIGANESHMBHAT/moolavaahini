'use client'

import { useState, useRef, useEffect } from 'react'

export function PostActionsMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as Element).closest('dialog')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Desktop: inline buttons */}
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {children}
      </div>

      {/* Mobile: kebab menu */}
      <div ref={ref} className="relative sm:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-1.5 text-tx3 hover:bg-surface2"
          aria-label="Actions"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {open && (
          <div
            className="absolute right-0 top-full z-20 mt-1 flex min-w-[140px] flex-col gap-1.5 rounded-xl border border-border bg-surface p-2 shadow-lg [&>*]:w-full [&>*]:justify-start [&>div>button]:w-full"
            onClick={(e) => {
              // Only close the menu when navigating (link click), not when opening dialogs (button click)
              if ((e.target as Element).closest('a')) setOpen(false)
            }}
          >
            {children}
          </div>
        )}
      </div>
    </>
  )
}
