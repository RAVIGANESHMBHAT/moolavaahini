'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export type PostActionResult =
  | { success: true; slug: string; id?: string }
  | { success: false; error: string }

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
    // Save to pending columns only — live content and status stay unchanged
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

export async function deletePost(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, status')
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

  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/admin/review')
  // Admins deleting someone else's post go back to the review queue
  if (isAdmin && post.author_id !== user.id) {
    redirect('/admin/review')
  }
  redirect('/dashboard')
}
