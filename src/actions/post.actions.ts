'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'

export type PostActionResult =
  | { success: true; slug: string; id?: string }
  | { success: false; error: string }

// Regex to extract storage paths from post body markdown/HTML
const IMAGE_PATH_RE =
  /\/storage\/v1\/object\/public\/post-images\/([^\s"')<>]+)/g

/** Extract all image storage paths referenced in a post body. */
function extractImagePaths(body: string): string[] {
  const paths: string[] = []
  let m: RegExpExecArray | null
  IMAGE_PATH_RE.lastIndex = 0
  while ((m = IMAGE_PATH_RE.exec(body)) !== null) paths.push(m[1])
  return paths
}

/** Record a newly uploaded image in the tracking table (post_id = NULL until post is saved). */
export async function trackImageUpload(path: string): Promise<void> {
  const user = await requireAuth()
  const serviceClient = createServiceClient()
  // Ignore conflicts — if the same path is somehow uploaded twice, keep the original row
  await serviceClient
    .from('image_uploads')
    .upsert({ path, user_id: user.id }, { onConflict: 'path', ignoreDuplicates: true })
}

/** Link all images found in body to the given post. Called after create/update.
 *  @param extraBody  Additional body to protect from unlinking (e.g. live body when saving approved post pending edits) */
async function linkImagesToPost(body: string, postId: string, extraBody = ''): Promise<void> {
  const serviceClient = createServiceClient()
  // Union paths from both bodies — never unlink an image still referenced in either
  const currentPaths = [...new Set([...extractImagePaths(body), ...extractImagePaths(extraBody)])]

  // Unlink images previously linked to this post but no longer in any active body.
  // Setting post_id = NULL marks them as orphaned — the cleanup job removes them after the grace period.
  if (currentPaths.length > 0) {
    await serviceClient
      .from('image_uploads')
      .update({ post_id: null })
      .eq('post_id', postId)
      .not('path', 'in', `(${currentPaths.join(',')})`)
  } else {
    // No images in either body — unlink everything previously linked to this post
    await serviceClient
      .from('image_uploads')
      .update({ post_id: null })
      .eq('post_id', postId)
  }

  // Link images in the new body that aren't yet linked to any post
  if (currentPaths.length > 0) {
    await serviceClient
      .from('image_uploads')
      .update({ post_id: postId })
      .in('path', currentPaths)
      .is('post_id', null)
  }
}

// Generate a URL-safe slug. Falls back to a random ID for non-ASCII titles (e.g. Kannada).
function makeSlug(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || Math.random().toString(36).slice(2, 10)
}

// Ensure the slug is unique by appending a counter when needed.
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  excludeId?: string
): Promise<string> {
  let candidate = base
  let counter = 0
  while (true) {
    const query = supabase.from('posts').select('id').eq('slug', candidate)
    if (excludeId) query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return candidate
    counter++
    candidate = `${base}-${counter}`
  }
}

export async function createPost(formData: FormData): Promise<PostActionResult> {
  const user = await requireAuth()
  const supabase = await createClient()

  const title = (formData.get('title') as string)?.trim()
  const body = (formData.get('body') as string)?.trim() ?? ''
  const community_id = formData.get('community_id') as string
  const category_id = formData.get('category_id') as string

  if (!title) return { success: false, error: 'Title is required' }
  if (title.length > 200) return { success: false, error: 'Title must be 200 characters or fewer' }
  if (body.length > 50000) return { success: false, error: 'Content must be 50,000 characters or fewer' }
  if (!community_id) return { success: false, error: 'Community is required' }
  if (!category_id) return { success: false, error: 'Category is required' }

  const slug = await uniqueSlug(supabase, makeSlug(title))

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      body,
      slug,
      community_id,
      category_id,
      author_id: user.id,
      status: 'draft',
    })
    .select('slug, id')
    .single()

  if (error) return { success: false, error: error.message }

  await linkImagesToPost(body, data.id)

  revalidatePath('/dashboard')
  return { success: true, slug: data.slug, id: data.id }
}

export async function updatePost(
  id: string,
  formData: FormData
): Promise<PostActionResult> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('posts')
    .select('author_id, status, slug')
    .eq('id', id)
    .single()

  if (!existing) return { success: false, error: 'Post not found' }
  if (existing.author_id !== user.id) return { success: false, error: 'Not authorized' }
  if (!['draft', 'rejected', 'approved', 'pending_review'].includes(existing.status)) {
    return { success: false, error: 'Cannot edit a post in its current state' }
  }

  const title = (formData.get('title') as string)?.trim()
  const body = (formData.get('body') as string)?.trim() ?? ''
  const community_id = formData.get('community_id') as string
  const category_id = formData.get('category_id') as string

  if (!title) return { success: false, error: 'Title is required' }
  if (title.length > 200) return { success: false, error: 'Title must be 200 characters or fewer' }
  if (body.length > 50000) return { success: false, error: 'Content must be 50,000 characters or fewer' }

  let updateSlug: string

  if (existing.status === 'approved') {
    // For approved posts, edits stage into pending columns — the live body stays published.
    // We must fetch the live body so we don't unlink images that are still shown on the live post.
    const { data: livePost } = await supabase
      .from('posts')
      .select('body')
      .eq('id', id)
      .single()
    const liveBody = livePost?.body ?? ''

    const { data, error } = await supabase
      .from('posts')
      .update({
        pending_title: title,
        pending_body: body,
        pending_community_id: community_id,
        pending_category_id: category_id,
      })
      .eq('id', id)
      .select('slug')
      .single()
    if (error) return { success: false, error: error.message }
    updateSlug = data.slug
    // Pass both bodies: only unlink images absent from both live and pending content
    await linkImagesToPost(body, id, liveBody)
  } else {
    // draft / rejected / pending_review: overwrite live content directly
    const { data, error } = await supabase
      .from('posts')
      .update({ title, body, community_id, category_id })
      .eq('id', id)
      .select('slug')
      .single()
    if (error) return { success: false, error: error.message }
    updateSlug = data.slug
    await linkImagesToPost(body, id)
  }

  revalidatePath('/dashboard')
  revalidatePath(`/posts/${updateSlug}`)
  return { success: true, slug: updateSlug }
}

export async function submitForReview(id: string): Promise<PostActionResult> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, status, title, body, slug, pending_title')
    .eq('id', id)
    .single()

  if (!post) return { success: false, error: 'Post not found' }
  if (post.author_id !== user.id) return { success: false, error: 'Not authorized' }

  let updatePayload: Record<string, unknown>

  if (post.status === 'approved') {
    // Submit the pending revision for review
    if (!post.pending_title?.trim()) {
      return { success: false, error: 'Save your changes before submitting for review' }
    }
    updatePayload = { pending_submitted_at: new Date().toISOString() }
  } else if (['draft', 'rejected', 'pending_review'].includes(post.status)) {
    // First-time submission: move status to pending_review
    if (!post.title?.trim()) return { success: false, error: 'Title is required to submit' }
    updatePayload = { status: 'pending_review' }
  } else {
    return { success: false, error: 'Post cannot be submitted in its current state' }
  }

  const { error } = await supabase
    .from('posts')
    .update(updatePayload)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/posts/${post.slug}`)
  return { success: true, slug: post.slug }
}

export async function discardPendingEdit(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: postData } = await supabase
    .from('posts')
    .select('author_id, status, slug')
    .eq('id', id)
    .single()

  const post = postData as { author_id: string; status: string; slug: string } | null

  if (!post) return { success: false, error: 'Post not found' }
  if (post.author_id !== user.id) return { success: false, error: 'Not authorized' }
  if (post.status !== 'approved') return { success: false, error: 'Only approved posts can have a pending edit discarded' }

  const { error } = await supabase
    .from('posts')
    .update({
      pending_title: null,
      pending_body: null,
      pending_community_id: null,
      pending_category_id: null,
      pending_submitted_at: null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/posts/${post.slug}`)
  return { success: true }
}

export async function clearEditRejection(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: postData } = await supabase
    .from('posts')
    .select('author_id, status')
    .eq('id', id)
    .single()

  const post = postData as { author_id: string; status: string } | null
  if (!post) return { success: false, error: 'Post not found' }
  if (post.author_id !== user.id) return { success: false, error: 'Not authorized' }
  if (post.status !== 'approved') return { success: false, error: 'Not applicable' }

  const { error } = await supabase
    .from('posts')
    .update({ rejection_reason: null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deletePost(id: string): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, status, body')
    .eq('id', id)
    .single()

  if (!post) return { success: false, error: 'Post not found' }

  // RLS enforces this too, but fail fast
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && post.author_id !== user.id) {
    return { success: false, error: 'Not authorized' }
  }

  // Use the service-role client for the delete — our own auth check above already
  // verified ownership, so bypassing RLS here is intentional and safe.
  const serviceClient = createServiceClient()

  // Best-effort: delete any uploaded images. Wrap in try/catch so a missing
  // bucket or storage error never blocks the post delete.
  if (post.body) {
    try {
      const urlRe = /https?:\/\/[^\s"')]+\/storage\/v1\/object\/public\/post-images\/([^\s"')]+)/g
      const paths: string[] = []
      let m: RegExpExecArray | null
      while ((m = urlRe.exec(post.body)) !== null) paths.push(m[1])
      if (paths.length > 0) {
        await serviceClient.storage.from('post-images').remove(paths)
      }
    } catch {
      // Storage cleanup is best-effort; don't block post deletion
    }
  }

  const { data: deleted, error } = await serviceClient
    .from('posts')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) return { success: false, error: error.message }
  if (!deleted || deleted.length === 0) return { success: false, error: 'Post not found.' }

  revalidatePath('/dashboard')
  revalidatePath('/admin/review')
  const redirectTo = isAdmin && post.author_id !== user.id ? '/admin/review' : '/dashboard'
  return { success: true, redirectTo }
}

/** Delete any post-images storage objects found in the given markdown body.
 *  Used when a new post draft is discarded before saving. */
export async function cleanupOrphanedImages(body: string): Promise<void> {
  if (!body) return
  const paths = extractImagePaths(body)
  if (paths.length === 0) return
  try {
    const serviceClient = createServiceClient()
    await serviceClient.storage.from('post-images').remove(paths)
    await serviceClient.from('image_uploads').delete().in('path', paths)
  } catch {
    // Best-effort; don't surface storage errors to the user
  }
}
