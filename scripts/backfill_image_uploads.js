/**
 * One-time backfill script: scans all storage objects in post-images bucket,
 * finds ones not tracked in image_uploads, and inserts them with:
 *   - post_id set   → if the image is referenced in a post body
 *   - post_id = NULL, uploaded_at = 8 days ago → if not referenced anywhere
 *     (so the cleanup job deletes them on its next run)
 *
 * Usage:
 *   node backfill_image_uploads.js            # run for real
 *   node backfill_image_uploads.js --dry-run  # preview only, no DB writes
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'post-images'
const IMAGE_PATH_RE = /\/storage\/v1\/object\/public\/post-images\/([^\s"')<>]+)/g

function extractPaths(body) {
  const paths = []
  IMAGE_PATH_RE.lastIndex = 0
  let m
  while ((m = IMAGE_PATH_RE.exec(body)) !== null) paths.push(m[1])
  return paths
}

async function listAllStoragePaths(supabase) {
  const all = []
  const { data: prefixes } = await supabase.storage.from(BUCKET).list('', { limit: 1000 })
  for (const prefix of prefixes ?? []) {
    let offset = 0
    while (true) {
      const { data: objects } = await supabase.storage
        .from(BUCKET)
        .list(prefix.name, { limit: 100, offset })
      if (!objects || objects.length === 0) break
      for (const obj of objects) all.push(`${prefix.name}/${obj.name}`)
      if (objects.length < 100) break
      offset += 100
    }
  }
  return all
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) console.log('── DRY RUN — no changes will be made ──\n')

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  console.log('Step 1: Loading already-tracked paths...')
  const { data: tracked } = await supabase.from('image_uploads').select('path')
  const trackedSet = new Set((tracked ?? []).map(r => r.path))
  console.log(`  Already tracked: ${trackedSet.size}`)

  console.log('Step 2: Building path → post_id map from post bodies...')
  const pathToPost = new Map()
  let page = 0
  while (true) {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, body, pending_body')
      .range(page * 500, (page + 1) * 500 - 1)
    if (!posts || posts.length === 0) break
    for (const post of posts) {
      const combined = (post.body ?? '') + ' ' + (post.pending_body ?? '')
      for (const path of extractPaths(combined)) {
        if (!pathToPost.has(path)) pathToPost.set(path, post.id)
      }
    }
    if (posts.length < 500) break
    page++
  }
  console.log(`  Paths referenced in posts: ${pathToPost.size}`)

  console.log('Step 3: Listing all storage objects...')
  const storagePaths = await listAllStoragePaths(supabase)
  console.log(`  Total storage objects: ${storagePaths.length}`)

  console.log('Step 4: Computing untracked objects...')
  const untracked = storagePaths.filter(p => !trackedSet.has(p))
  console.log(`  Untracked: ${untracked.length}`)

  if (untracked.length === 0) {
    console.log('\nNothing to insert. All storage objects are already tracked.')
    return
  }

  const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const toInsert = untracked.map(path => {
    const postId = pathToPost.get(path) ?? null
    return { path, user_id: path.split('/')[0], post_id: postId, uploaded_at: postId ? now : oldDate }
  })

  const linked   = toInsert.filter(r => r.post_id).length
  const orphaned = toInsert.filter(r => !r.post_id).length
  console.log(`  → ${linked} will be linked to posts`)
  console.log(`  → ${orphaned} will be marked orphaned (deleted on next cleanup run)`)

  if (orphaned > 0) {
    console.log('\nOrphaned images that will be deleted:')
    toInsert.filter(r => !r.post_id).forEach(r => console.log(`    ${r.path}`))
  }

  if (dryRun) {
    console.log('\nDry run complete — nothing was written.')
    return
  }

  console.log('\nStep 5: Inserting rows...')
  const batchSize = 100
  let inserted = 0
  for (let i = 0; i < toInsert.length; i += batchSize) {
    await supabase
      .from('image_uploads')
      .upsert(toInsert.slice(i, i + batchSize), { onConflict: 'path', ignoreDuplicates: true })
    inserted += Math.min(batchSize, toInsert.length - i)
    console.log(`  Inserted ${inserted}/${toInsert.length}...`)
  }

  console.log(`\nDone. ${inserted} rows inserted.`)
  console.log(`  Linked to posts : ${linked}`)
  console.log(`  Marked orphaned : ${orphaned}  ← cleanup job will delete these on next run`)
}

main().catch(err => { console.error(err); process.exit(1) })
