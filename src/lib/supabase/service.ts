import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

/**
 * Service-role client – bypasses RLS.
 * Use for trusted server-side writes that normal users cannot perform.
 * NEVER import this in client code or expose to the browser.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
