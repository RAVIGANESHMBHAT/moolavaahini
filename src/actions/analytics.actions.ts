'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { requireRole } from '@/lib/roles'

export interface DayStats {
  date: string
  value: number
}

export interface TopPost {
  title: string
  slug: string
  views: number
}

export interface CommunityStats {
  name: string
  count: number
}

export interface CategoryStats {
  name: string
  count: number
}

export interface ReviewMetrics {
  approvalRate: number   // 0–100
  avgReviewHours: number // average hours from created_at to published_at
  approvedCount: number
  rejectedCount: number
}

export interface AnalyticsData {
  totalViews: number
  viewsByDay: DayStats[]
  postsSubmitted: number
  postsPublished: number
  submittedByDay: DayStats[]
  publishedByDay: DayStats[]
  topPosts: TopPost[]
  byCommunity: CommunityStats[]
  byCategory: CategoryStats[]
  reviewMetrics: ReviewMetrics
  newUsersByDay: DayStats[]
  totalNewUsers: number
}

function eachDay(from: string, to: string): string[] {
  const days: string[] = []
  const cur = new Date(from)
  const end = new Date(to)
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function bucketByDay(rows: { day: string; count: number }[], days: string[]): DayStats[] {
  const map = new Map(rows.map((r) => [r.day, r.count]))
  return days.map((date) => ({ date, value: map.get(date) ?? 0 }))
}

export async function getAnalyticsData(from: string, to: string): Promise<AnalyticsData> {
  const user = await requireAuth()
  await requireRole(user.id, 'admin')

  const supabase = await createClient()
  const fromFull = `${from}T00:00:00.000Z`
  const toFull = `${to}T23:59:59.999Z`

  const [
    viewsRes,
    submittedRes,
    approvedRes,
    rejectedRes,
    topPostsRes,
    allApprovedPostsRes,
    newUsersRes,
  ] = await Promise.all([
    // Daily aggregated view counts
    supabase.from('post_views').select('date, count').gte('date', from).lte('date', to),
    supabase.from('posts').select('created_at').neq('status', 'draft').gte('created_at', fromFull).lte('created_at', toFull),
    supabase.from('posts').select('published_at, created_at').eq('status', 'approved').not('published_at', 'is', null).gte('published_at', fromFull).lte('published_at', toFull),
    supabase.from('posts').select('id').eq('status', 'rejected').gte('updated_at', fromFull).lte('updated_at', toFull),
    supabase.from('post_views').select('post_id, count, posts!inner(title, slug)').gte('date', from).lte('date', to),
    // All-time published posts for community/category breakdown
    supabase.from('posts').select('community:communities!posts_community_id_fkey(name), category:categories!posts_category_id_fkey(name)').eq('status', 'approved'),
    supabase.from('profiles').select('created_at').gte('created_at', fromFull).lte('created_at', toFull),
  ])

  const days = eachDay(from, to)

  // Views by day — sum count per date
  const viewDayCounts = new Map<string, number>()
  let totalViews = 0
  for (const row of viewsRes.data ?? []) {
    viewDayCounts.set(row.date, (viewDayCounts.get(row.date) ?? 0) + row.count)
    totalViews += row.count
  }
  const viewsByDay = bucketByDay(Array.from(viewDayCounts.entries()).map(([day, count]) => ({ day, count })), days)

  // Submitted by day
  const subDayCounts = new Map<string, number>()
  for (const row of submittedRes.data ?? []) {
    const day = row.created_at.slice(0, 10)
    subDayCounts.set(day, (subDayCounts.get(day) ?? 0) + 1)
  }
  const submittedByDay = bucketByDay(Array.from(subDayCounts.entries()).map(([day, count]) => ({ day, count })), days)

  // Published by day + avg review time
  const pubDayCounts = new Map<string, number>()
  let totalReviewMs = 0
  let reviewedCount = 0
  for (const row of approvedRes.data ?? []) {
    if (!row.published_at) continue
    const day = row.published_at.slice(0, 10)
    pubDayCounts.set(day, (pubDayCounts.get(day) ?? 0) + 1)
    const ms = new Date(row.published_at).getTime() - new Date(row.created_at).getTime()
    if (ms > 0) { totalReviewMs += ms; reviewedCount++ }
  }
  const publishedByDay = bucketByDay(Array.from(pubDayCounts.entries()).map(([day, count]) => ({ day, count })), days)

  // Review metrics
  const approvedCount = approvedRes.data?.length ?? 0
  const rejectedCount = rejectedRes.data?.length ?? 0
  const total = approvedCount + rejectedCount
  const reviewMetrics: ReviewMetrics = {
    approvedCount,
    rejectedCount,
    approvalRate: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
    avgReviewHours: reviewedCount > 0 ? Math.round(totalReviewMs / reviewedCount / 1000 / 3600) : 0,
  }

  // Top posts — sum count per post across all days in range
  const postViewCounts = new Map<string, { title: string; slug: string; views: number }>()
  for (const row of topPostsRes.data ?? []) {
    const post = row.posts as unknown as { title: string; slug: string }
    if (!post) continue
    const existing = postViewCounts.get(row.post_id)
    if (existing) { existing.views += row.count }
    else { postViewCounts.set(row.post_id, { title: post.title, slug: post.slug, views: row.count }) }
  }
  const topPosts = Array.from(postViewCounts.values()).sort((a, b) => b.views - a.views).slice(0, 5)

  // Community & category breakdown (all-time published)
  const communityMap = new Map<string, number>()
  const categoryMap = new Map<string, number>()
  for (const row of allApprovedPostsRes.data ?? []) {
    const comm = (row.community as unknown as { name: string })?.name
    const cat = (row.category as unknown as { name: string })?.name
    if (comm) communityMap.set(comm, (communityMap.get(comm) ?? 0) + 1)
    if (cat) categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1)
  }
  const byCommunity = Array.from(communityMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  const byCategory = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)

  // New users by day
  const userDayCounts = new Map<string, number>()
  for (const row of newUsersRes.data ?? []) {
    const day = row.created_at.slice(0, 10)
    userDayCounts.set(day, (userDayCounts.get(day) ?? 0) + 1)
  }
  const newUsersByDay = bucketByDay(Array.from(userDayCounts.entries()).map(([day, count]) => ({ day, count })), days)

  return {
    totalViews,
    viewsByDay,
    postsSubmitted: submittedRes.data?.length ?? 0,
    postsPublished: approvedCount,
    submittedByDay,
    publishedByDay,
    topPosts,
    byCommunity,
    byCategory,
    reviewMetrics,
    newUsersByDay,
    totalNewUsers: newUsersRes.data?.length ?? 0,
  }
}
