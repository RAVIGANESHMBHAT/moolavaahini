'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { updateUserRole } from '@/actions/profile.actions'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['user', 'contributor', 'admin']

export function RoleSelector({ userId, currentRole, isSelf }: { userId: string; currentRole: UserRole; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(currentRole)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (role: UserRole) => {
    setOpen(false)
    if (role === value) return
    setValue(role)
    startTransition(async () => {
      const result = await updateUserRole(userId, role)
      if (!result.success) { alert(result.error); setValue(value) }
    })
  }

  if (isSelf) {
    return (
      <span className="inline-block rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium capitalize text-tx3">
        {currentRole} (you)
      </span>
    )
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={isPending}
        onClick={() => !isPending && setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium capitalize text-tx2 focus:border-saffron-400 focus:outline-none focus:ring-1 focus:ring-saffron-400 disabled:opacity-50"
      >
        {value}
        <svg className={cn('h-3 w-3 text-tx4 transition-transform', open && 'rotate-180')} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 z-50 mt-1 min-w-full overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
          {ROLES.map((r) => (
            <li
              key={r}
              onClick={() => handleSelect(r)}
              className={cn(
                'cursor-pointer px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                r === value
                  ? 'bg-saffron-50 text-saffron-700 dark:bg-saffron-950 dark:text-saffron-300'
                  : 'text-tx hover:bg-surface2'
              )}
            >
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
