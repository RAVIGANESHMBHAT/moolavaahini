'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { requireRole } from '@/lib/roles'

export type ReviewResult =
  | { success: true }
  | { success: false; error: string }

export async function approvePost(id: string, updatedAt: string): Promise<ReviewResult> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('status, slug, author_id, updated_at, pending_title, pending_body, pending_community_id, pending_category_id')
    .eq('id', id)
    .single()

  if (!post) return { success: false, error: 'Post not found' }

  // Stale check — catches concurrent edits
  if (post.updated_at !== updatedAt) {
    return { success: false, error: 'This post was edited after you opened it. Please reload to review the latest version.' }
  }

  if (post.status === 'pending_review') {
    // ── First-time approval ──────────────────────────────────
    const { error } = await supabase
      .from('posts')
      .update({
        status: 'approved',
        reviewer_id: user.id,
        published_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    // Auto-promote author to contributor
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', post.author_id)
      .single()

    if (authorProfile?.role === 'user') {
      const adminClient = createAdminClient()
      await adminClient
        .from('profiles')
        .update({ role: 'contributor' })
        .eq('id', post.author_id)
    }
  } else if (post.status === 'approved' && post.pending_title) {
    // ── Edit approval: promote pending revision to live ──────
    const { error } = await supabase
      .from('posts')
      .update({
        title: post.pending_title,
        body: post.pending_body ?? '',
        community_id: post.pending_community_id ?? undefined,
        category_id: post.pending_category_id ?? undefined,
        reviewer_id: user.id,
        published_at: new Date().toISOString(),
        rejection_reason: null,
        pending_title: null,
        pending_body: null,
        pending_community_id: null,
        pending_category_id: null,
        pending_submitted_at: null,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
  } else {
    return { success: false, error: 'Post is not pending review' }
  }

  revalidatePath('/admin/review')
  revalidatePath('/')
  revalidatePath(`/posts/${post.slug}`)
  return { success: true }
}

export async function rejectPost(id: string, reason: string, updatedAt: string): Promise<ReviewResult> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  if (!reason?.trim()) {
    return { success: false, error: 'Rejection reason is required' }
  }

  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('status, slug, updated_at')
    .eq('id', id)
    .single()

  if (!post) return { success: false, error: 'Post not found' }

  // Stale check
  if (post.updated_at !== updatedAt) {
    return { success: false, error: 'This post was edited after you opened it. Please reload to review the latest version.' }
  }

  if (post.status === 'pending_review') {
    // ── First-time rejection ─────────────────────────────────
    const { error } = await supabase
      .from('posts')
      .update({
        status: 'rejected',
        reviewer_id: user.id,
        rejection_reason: reason.trim(),
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
  } else if (post.status === 'approved') {
    // ── Edit rejection: discard pending revision, keep live content ──
    const { error } = await supabase
      .from('posts')
      .update({
        reviewer_id: user.id,
        rejection_reason: reason.trim(),
        pending_title: null,
        pending_body: null,
        pending_community_id: null,
        pending_category_id: null,
        pending_submitted_at: null,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
  } else {
    return { success: false, error: 'Post is not pending review' }
  }

  revalidatePath('/admin/review')
  revalidatePath(`/posts/${post.slug}`)
  return { success: true }
}
