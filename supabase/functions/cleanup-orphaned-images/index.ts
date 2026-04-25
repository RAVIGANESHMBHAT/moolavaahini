import { createClient } from 'jsr:@supabase/supabase-js@2'

const BUCKET = 'post-images'
const GRACE_PERIOD_HOURS = 24

Deno.serve(async (req) => {
  // Protect the endpoint with a shared secret so only the cron caller can trigger it
  const authHeader = req.headers.get('Authorization')
  const expectedToken = Deno.env.get('CLEANUP_SECRET')
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const cutoff = new Date(Date.now() - GRACE_PERIOD_HOURS * 60 * 60 * 1000).toISOString()

    // 1. Find orphaned images: uploaded but never linked to a post, past the grace period.
    //    This query is O(orphaned rows) — it never scans posts or storage objects.
    const { data: orphaned, error: queryError } = await supabase
      .from('image_uploads')
      .select('path')
      .is('post_id', null)
      .lt('uploaded_at', cutoff)

    if (queryError) throw new Error(`Failed to query orphaned images: ${queryError.message}`)
    if (!orphaned || orphaned.length === 0) {
      return new Response(JSON.stringify({ deleted: 0, ranAt: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const paths = orphaned.map((r) => r.path)

    // 2. Delete from storage in batches of 100
    let deletedCount = 0
    const batchSize = 100
    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize)
      const { error: storageError } = await supabase.storage.from(BUCKET).remove(batch)
      if (storageError) {
        console.error(`Storage delete failed at offset ${i}: ${storageError.message}`)
        continue
      }
      // 3. Remove tracking rows only after storage delete succeeds
      await supabase.from('image_uploads').delete().in('path', batch)
      deletedCount += batch.length
    }

    const summary = {
      orphanedFound: paths.length,
      deleted: deletedCount,
      gracePeriodHours: GRACE_PERIOD_HOURS,
      ranAt: new Date().toISOString(),
    }
    console.log('Cleanup summary:', JSON.stringify(summary))
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Cleanup failed:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
