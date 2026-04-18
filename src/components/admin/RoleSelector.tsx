'use client'

import { useTransition } from 'react'
import { updateUserRole } from '@/actions/profile.actions'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['user', 'contributor', 'admin']

export function RoleSelector({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string
  currentRole: UserRole
  isSelf: boolean
}) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if (!result.success) alert(result.error)
    })
  }

  if (isSelf) {
    return (
      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
        {currentRole} (you)
      </span>
    )
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium capitalize text-gray-700 focus:border-saffron-400 focus:outline-none focus:ring-1 focus:ring-saffron-400 disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  )
}
