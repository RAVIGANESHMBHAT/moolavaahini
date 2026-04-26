'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { requireRole } from '@/lib/roles'
import { revalidatePath } from 'next/cache'

export interface ContributorPost {
  id: string
  title: string
  slug: string
  category: string
  totalViews: number
}

export interface ContributorRow {
  userId: string
  displayName: string
  avatarUrl: string | null
  posts: ContributorPost[]
  postCount: number
  totalViews: number
  paymentId: string | null
  status: 'pending' | 'paid'
  paidAt: string | null
  paidAmount: number | null
  ratesConfig: Record<string, number> | null
  notes: string | null
}

export interface PayoutsData {
  contributors: ContributorRow[]
  totalPosts: number
  totalViews: number
  totalPaid: number
  totalPending: number
}

export interface OutstandingContributor {
  userId: string
  displayName: string
  posts: ContributorPost[]
  postCount: number
}

export interface OutstandingMonth {
  month: string // YYYY-MM
  contributors: OutstandingContributor[]
}

export async function getPayoutsData(month: string): Promise<PayoutsData> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()

  // month = 'YYYY-MM' → date range for published_at (set when post is approved)
  const monthStart = `${month}-01T00:00:00.000Z`
  const nextMonthDate = new Date(`${month}-01`)
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
  const monthEnd = nextMonthDate.toISOString()

  const [postsRes, paymentsRes] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, slug, category:categories!posts_category_id_fkey(slug), author_id, author:profiles!posts_author_id_fkey(id, display_name, avatar_url)')
      .eq('status', 'approved')
      .gte('published_at', monthStart)
      .lt('published_at', monthEnd),
    supabase
      .from('contributor_payments')
      .select('*')
      .eq('month', `${month}-01`),
  ])

  const posts = postsRes.data ?? []
  const payments = paymentsRes.data ?? []

  // Fetch all-time view totals for these posts
  const postIds = posts.map((p) => p.id)
  const viewsRes = postIds.length > 0
    ? await supabase.from('post_views').select('post_id, count').in('post_id', postIds)
    : { data: [] as { post_id: string; count: number }[] }

  // Sum views per post
  const viewMap = new Map<string, number>()
  for (const row of viewsRes.data ?? []) {
    viewMap.set(row.post_id, (viewMap.get(row.post_id) ?? 0) + row.count)
  }

  // Group posts by author
  type AuthorData = { author: { id: string; display_name: string; avatar_url: string | null }; posts: ContributorPost[] }
  const authorMap = new Map<string, AuthorData>()
  for (const post of posts) {
    const author = post.author as unknown as { id: string; display_name: string; avatar_url: string | null }
    if (!author) continue
    if (!authorMap.has(author.id)) authorMap.set(author.id, { author, posts: [] })
    authorMap.get(author.id)!.posts.push({
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: (post.category as unknown as { slug: string } | null)?.slug ?? '',
      totalViews: viewMap.get(post.id) ?? 0,
    })
  }

  const paymentByContributor = new Map(payments.map((p) => [p.contributor_id, p]))

  const contributors: ContributorRow[] = Array.from(authorMap.values())
    .map(({ author, posts: authorPosts }) => {
      const payment = paymentByContributor.get(author.id)
      return {
        userId: author.id,
        displayName: author.display_name,
        avatarUrl: author.avatar_url,
        posts: authorPosts.sort((a, b) => b.totalViews - a.totalViews),
        postCount: authorPosts.length,
        totalViews: authorPosts.reduce((sum, p) => sum + p.totalViews, 0),
        paymentId: payment?.id ?? null,
        status: (payment?.status ?? 'pending') as 'pending' | 'paid',
        paidAt: payment?.paid_at ?? null,
        paidAmount: payment ? Number(payment.amount) : null,
        ratesConfig: payment?.rates_config ?? null,
        notes: payment?.notes ?? null,
      }
    })
    .sort((a, b) => b.postCount - a.postCount)

  const paidContributors = contributors.filter((c) => c.status === 'paid')
  const pendingContributors = contributors.filter((c) => c.status === 'pending')

  return {
    contributors,
    totalPosts: posts.length,
    totalViews: Array.from(viewMap.values()).reduce((s, v) => s + v, 0),
    totalPaid: paidContributors.reduce((s, c) => s + (c.paidAmount ?? 0), 0),
    totalPending: pendingContributors.length,
  }
}

export async function getOutstandingPayments(): Promise<OutstandingMonth[]> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()

  const [postsRes, paymentsRes] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, slug, category:categories!posts_category_id_fkey(slug), author_id, published_at, author:profiles!posts_author_id_fkey(id, display_name)')
      .eq('status', 'approved'),
    supabase
      .from('contributor_payments')
      .select('contributor_id, month')
      .eq('status', 'paid'),
  ])

  const posts = postsRes.data ?? []
  // Build set of paid keys: "contributor_id|YYYY-MM-01"
  const paidKeys = new Set(
    (paymentsRes.data ?? []).map((p) => `${p.contributor_id}|${p.month}`)
  )

  // Group by (author_id, YYYY-MM), skipping already-paid months
  const groups = new Map<string, { month: string; contributor: OutstandingContributor }>()

  for (const post of posts) {
    const author = post.author as unknown as { id: string; display_name: string }
    if (!author) continue
    const monthStr = (post.published_at as string).slice(0, 7) // YYYY-MM
    if (paidKeys.has(`${author.id}|${monthStr}-01`)) continue

    const groupKey = `${author.id}|${monthStr}`
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        month: monthStr,
        contributor: { userId: author.id, displayName: author.display_name, posts: [], postCount: 0 },
      })
    }
    const group = groups.get(groupKey)!
    group.contributor.posts.push({ id: post.id, title: post.title, slug: post.slug, category: (post.category as unknown as { slug: string } | null)?.slug ?? '', totalViews: 0 })
    group.contributor.postCount++
  }

  // Aggregate by month
  const monthMap = new Map<string, OutstandingMonth>()
  for (const { month, contributor } of groups.values()) {
    if (!monthMap.has(month)) monthMap.set(month, { month, contributors: [] })
    monthMap.get(month)!.contributors.push(contributor)
  }

  return Array.from(monthMap.values())
    .sort((a, b) => b.month.localeCompare(a.month))
    .map((m) => ({ ...m, contributors: m.contributors.sort((a, b) => b.postCount - a.postCount) }))
}

export async function markAsPaid(
  contributorId: string,
  month: string,
  postCount: number,
  amount: number,
  ratesConfig: Record<string, number>,
  notes: string,
): Promise<void> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()

  await supabase.from('contributor_payments').upsert({
    contributor_id: contributorId,
    month: `${month}-01`,
    post_count: postCount,
    rate_per_post: null,
    rates_config: ratesConfig,
    amount,
    status: 'paid',
    paid_at: new Date().toISOString(),
    notes: notes.trim() || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'contributor_id,month' })

  revalidatePath('/admin/payouts')
}

export async function markAsUnpaid(paymentId: string): Promise<void> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()
  await supabase
    .from('contributor_payments')
    .update({ status: 'pending', paid_at: null, notes: null, updated_at: new Date().toISOString() })
    .eq('id', paymentId)

  revalidatePath('/admin/payouts')
}

// ─── Payout rate config ────────────────────────────────────────────────────────

const DEFAULT_PAYOUT_RATES: Record<string, number> = {
  'ogatu': 1,
  'gaade': 1,
  'naati-aushadha': 5,
  'recipe': 5,
  'ritual': 5,
}

export async function getPayoutRates(): Promise<Record<string, number>> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_config')
    .select('value')
    .eq('key', 'payout_rates')
    .single()

  return (data?.value as Record<string, number>) ?? DEFAULT_PAYOUT_RATES
}

export async function savePayoutRates(rates: Record<string, number>): Promise<void> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()
  await supabase
    .from('admin_config')
    .upsert({ key: 'payout_rates', value: rates, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

// ─── Payment receipt ───────────────────────────────────────────────────────────

export interface PaymentReceiptPost {
  title: string
  slug: string
  category: string
  rate: number
}

export interface PaymentReceipt {
  paymentId: string
  contributorName: string
  month: string       // YYYY-MM
  paidAt: string
  notes: string | null
  amount: number
  posts: PaymentReceiptPost[]
}

export async function getPaymentReceipt(paymentId: string): Promise<PaymentReceipt | null> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('contributor_payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (!payment) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', payment.contributor_id)
    .single()

  const monthStr = (payment.month as string).slice(0, 7) // YYYY-MM
  const monthStart = `${monthStr}-01T00:00:00.000Z`
  const nextMonthDate = new Date(`${monthStr}-01`)
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
  const monthEnd = nextMonthDate.toISOString()

  const { data: posts } = await supabase
    .from('posts')
    .select('title, slug, category:categories!posts_category_id_fkey(slug)')
    .eq('author_id', payment.contributor_id)
    .eq('status', 'approved')
    .gte('published_at', monthStart)
    .lt('published_at', monthEnd)

  const ratesConfig = (payment.rates_config as Record<string, number>) ?? {}

  const receiptPosts: PaymentReceiptPost[] = (posts ?? []).map((p) => {
    const slug = (p.category as unknown as { slug: string } | null)?.slug ?? ''
    return { title: p.title, slug: p.slug, category: slug, rate: ratesConfig[slug] ?? 0 }
  })

  return {
    paymentId: payment.id,
    contributorName: profile?.display_name ?? 'Contributor',
    month: monthStr,
    paidAt: payment.paid_at,
    notes: payment.notes,
    amount: Number(payment.amount),
    posts: receiptPosts,
  }
}
