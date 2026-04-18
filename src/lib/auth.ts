import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function requireAuth() {
  const user = await getSession()
  if (!user) redirect('/auth')
  return user
}
