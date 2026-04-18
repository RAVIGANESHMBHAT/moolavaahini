'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { requireRole } from '@/lib/roles'
import type { UserRole } from '@/types'

export async function upsertProfile(formData: FormData) {
  const user = await requireAuth()
  const supabase = await createClient()

  const display_name = (formData.get('display_name') as string)?.trim()
  const avatar_url = (formData.get('avatar_url') as string)?.trim() || null

  const { error } = await supabase
    .from('profiles')
    .update({ display_name, avatar_url })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateUserRole(
  targetUserId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  // Use service-role to bypass RLS role protection
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
