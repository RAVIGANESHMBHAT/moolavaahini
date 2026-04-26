'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getAnalyticsData, type AnalyticsData } from '@/actions/analytics.actions'

const COLORS = ['#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#0891b2']

function toLocalDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return { from: toLocalDateString(from), to: toLocalDateString(to) }
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-3xl font-bold text-tx">{value}</p>
      {sub && <p className="mt-0.5 text-sm font-medium text-tx2">{sub}</p>}
      <p className="mt-1 text-sm text-tx3">{label}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-tx2">{title}</h2>
      {children}
    </div>
  )
}

function shortDate(d: string) {
  return d.slice(5) // MM-DD
}

export default function AnalyticsPage() {
  const t = useTranslations('analytics')
  const [isPending, startTransition] = useTransition()
  const [range, setRange] = useState(defaultRange)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    startTransition(async () => {
      const result = await getAnalyticsData(range.from, range.to)
      setData(result)
    })
  }, [range.from, range.to])

  const activityData = data?.submittedByDay.map((d, i) => ({
    date: shortDate(d.date),
    [t('submitted')]: d.value,
    [t('published')]: data.publishedByDay[i]?.value ?? 0,
  })) ?? []

  const viewsData = data?.viewsByDay.map((d) => ({
    date: shortDate(d.date),
    [t('viewCount')]: d.value,
  })) ?? []

  const usersData = data?.newUsersByDay.map((d) => ({
    date: shortDate(d.date),
    [t('newUsers')]: d.value,
  })) ?? []

  const tooltipStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--color-tx)',
  }

  const tooltipItemStyle = { color: 'var(--color-tx2)' }
  const legendStyle = { fontSize: 12, color: 'var(--color-tx2)' }
  const tickStyle = { fontSize: 11 }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-tx">{t('title')}</h1>

      {/* Date range picker */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-tx3">{t('dateFrom')}</label>
          <input
            type="date"
            value={range.from}
            max={range.to}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-saffron-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-tx3">{t('dateTo')}</label>
          <input
            type="date"
            value={range.to}
            min={range.from}
            max={toLocalDateString(new Date())}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-saffron-500"
          />
        </div>
        {isPending && <p className="pb-2 text-xs text-tx4">Loading…</p>}
      </div>

      {data && (
        <div className="space-y-6">
          {/* Summary row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t('totalViews')} value={data.totalViews} />
            <StatCard label={t('postsSubmitted')} value={data.postsSubmitted} />
            <StatCard label={t('postsPublished')} value={data.postsPublished} />
            <StatCard label={t('newUsers')} value={data.totalNewUsers} />
          </div>

          {/* Review quality */}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label={t('approvalRate')}
              value={`${data.reviewMetrics.approvalRate}%`}
              sub={`${data.reviewMetrics.approvedCount} ${t('approved')} · ${data.reviewMetrics.rejectedCount} ${t('rejected')}`}
            />
            <StatCard
              label={t('avgReviewTime')}
              value={data.reviewMetrics.avgReviewHours > 0 ? `${data.reviewMetrics.avgReviewHours} ${t('hours')}` : '—'}
            />
          </div>

          {/* Views over time */}
          {data.totalViews > 0 && (
            <ChartCard title={t('viewsOverTime')}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={viewsData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={tickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Area type="monotone" dataKey={t('viewCount')} stroke="#3b82f6" fill="url(#viewsGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Posts activity */}
          {(data.postsSubmitted > 0 || data.postsPublished > 0) && (
            <ChartCard title={t('postsActivity')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={tickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Legend iconType="square" iconSize={10} wrapperStyle={legendStyle} />
                  <Bar dataKey={t('submitted')} fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey={t('published')} fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* User growth */}
          {data.totalNewUsers > 0 && (
            <ChartCard title={t('userGrowth')}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={usersData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={tickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Area type="monotone" dataKey={t('newUsers')} stroke="#8b5cf6" fill="url(#usersGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Community & category breakdown (all-time) */}
          {(data.byCommunity.length > 0 || data.byCategory.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.byCommunity.length > 0 && (
                <ChartCard title={`${t('byCommunity')} · ${t('allTime')}`}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.byCommunity}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent, x, y }) => (
                          <text x={x} y={y} style={{ fill: 'var(--color-text)', fontSize: 11 }} textAnchor="middle" dominantBaseline="central">
                            {`${name} ${Math.round((percent ?? 0) * 100)}%`}
                          </text>
                        )}
                        labelLine={false}
                        fontSize={11}
                      >
                        {data.byCommunity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              {data.byCategory.length > 0 && (
                <ChartCard title={`${t('byCategory')} · ${t('allTime')}`}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.byCategory} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                      <XAxis type="number" tick={tickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={tickStyle} tickLine={false} axisLine={false} width={120} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                      <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                        {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}

          {/* Top posts */}
          {data.topPosts.length > 0 && (
            <div className="rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold text-tx2">{t('topPosts')}</h2>
              </div>
              <ul className="divide-y divide-border">
                {data.topPosts.map((p) => (
                  <li key={p.slug} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <Link href={`/posts/${p.slug}`} className="truncate text-sm text-tx hover:text-saffron-700 dark:hover:text-saffron-400">
                      {p.title}
                    </Link>
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {p.views} {p.views === 1 ? t('viewCountSingular') : t('viewCount')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!data.totalViews && !data.postsSubmitted && !data.postsPublished && !data.totalNewUsers && (
            <p className="text-sm text-tx3">{t('noData')}</p>
          )}
        </div>
      )}
    </div>
  )
}
