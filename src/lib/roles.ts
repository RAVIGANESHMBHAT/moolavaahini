import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role ?? null
}

export async function requireRole(userId: string, minRole: UserRole) {
  const role = await getUserRole(userId)
  const hierarchy: UserRole[] = ['user', 'contributor', 'admin']
  if (!role || hierarchy.indexOf(role) < hierarchy.indexOf(minRole)) {
    redirect('/')
  }
  return role
}

export function isAdmin(role: UserRole | null) {
  return role === 'admin'
}

export function isContributor(role: UserRole | null) {
  return role === 'contributor' || role === 'admin'
}
