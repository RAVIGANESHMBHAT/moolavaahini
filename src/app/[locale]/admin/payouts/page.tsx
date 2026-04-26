'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CATEGORIES } from '@/lib/categories'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ReceiptModal } from '@/components/payouts/ReceiptModal'
import {
  getPayoutsData, getOutstandingPayments, getPayoutRates, savePayoutRates,
  markAsPaid, markAsUnpaid,
  type ContributorRow, type PayoutsData, type OutstandingMonth,
} from '@/actions/payouts.actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function monthOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value, label: monthLabel(value) }
  })
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

// Maps DB slug → categories i18n key
function catKey(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.nameKey ?? slug
}

// Default rates per category slug (used until DB config loads)
const DEFAULT_RATES: Record<string, number> = {
  'ogatu': 1,
  'gaade': 1,
  'naati-aushadha': 5,
  'recipe': 5,
  'ritual': 5,
}

// Calculate amount for a contributor given per-category rates
function calcAmount(posts: { category: string }[], rates: Record<string, number>) {
  return posts.reduce((sum, p) => sum + (rates[p.category] ?? 0), 0)
}

// ─── Outstanding section ──────────────────────────────────────────────────────

function OutstandingSection({
  outstanding, rates, onSelectMonth,
}: {
  outstanding: OutstandingMonth[]
  rates: Record<string, number>
  onSelectMonth: (month: string) => void
}) {
  const t = useTranslations('payouts')

  if (outstanding.length === 0) return null

  const totalOwed = outstanding.reduce(
    (sum, m) => sum + m.contributors.reduce((s, c) => s + calcAmount(c.posts, rates), 0),
    0,
  )

  return (
    <div className="mb-8 rounded-xl border border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20 p-5">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t('outstandingPayments')}</h2>
        <span className="text-xs text-amber-600 dark:text-amber-500">
          ₹{totalOwed} {t('outstandingAcross')} {outstanding.length} {outstanding.length === 1 ? t('outstandingMonth') : t('outstandingMonths')}
        </span>
      </div>
      <div className="space-y-2">
        {outstanding.map((m) => {
          const monthTotal = m.contributors.reduce((s, c) => s + calcAmount(c.posts, rates), 0)
          const postCount = m.contributors.reduce((s, c) => s + c.postCount, 0)
          return (
            <div key={m.month} className="flex items-center justify-between gap-4 rounded-lg bg-white/60 dark:bg-black/20 px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-tx">{monthLabel(m.month)}</p>
                <p className="mt-0.5 text-xs text-tx3">
                  {m.contributors.length} {t('contributors')} · {postCount} {postCount === 1 ? t('post') : t('posts')} · ₹{monthTotal}
                </p>
              </div>
              <button
                onClick={() => onSelectMonth(m.month)}
                className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-tx2 hover:bg-surface-2"
              >
                {t('viewMonth')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Contributor card ─────────────────────────────────────────────────────────

function ContributorCard({
  contributor, month, rates, onRefresh,
}: {
  contributor: ContributorRow
  month: string
  rates: Record<string, number>
  onRefresh: () => void
}) {
  const t = useTranslations('payouts')
  const tCat = useTranslations('categories')
  const [expanded, setExpanded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  const amount = calcAmount(contributor.posts, rates)

  // Group posts by category for breakdown display
  const byCategory = contributor.posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1
    return acc
  }, {})

  const handleMarkPaid = () => {
    startTransition(async () => {
      await markAsPaid(contributor.userId, month, contributor.postCount, amount, rates, notes)
      setShowConfirm(false)
      setNotes('')
      onRefresh()
    })
  }

  const handleMarkUnpaid = () => {
    if (!contributor.paymentId) return
    startTransition(async () => {
      await markAsUnpaid(contributor.paymentId!)
      onRefresh()
    })
  }

  const handleClose = () => {
    if (isPending) return
    setShowConfirm(false)
    setNotes('')
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Main row */}
      <div className="px-4 py-3 sm:px-5">
        {/* Top line: expand + name + amount — always visible */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 text-tx3 hover:text-tx transition-colors"
            aria-label="Toggle posts"
          >
            <span className={`inline-block text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-tx">{contributor.displayName}</p>
          <span className="shrink-0 text-sm font-bold text-tx">
            {contributor.status === 'paid' && contributor.paidAmount != null
              ? `₹${contributor.paidAmount}`
              : `₹${amount}`}
          </span>
        </div>

        {/* Bottom line: stats + action */}
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pl-5">
          <span className="text-xs text-tx3">
            {contributor.postCount} {contributor.postCount === 1 ? t('post') : t('posts')} · {contributor.totalViews} {t('views')}
          </span>

          {contributor.status === 'paid' ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                ✓ {t('paid')} {formatDate(contributor.paidAt)}
              </span>
              <ReceiptModal paymentId={contributor.paymentId!} label={t('viewReceipt')} />
              <button
                onClick={handleMarkUnpaid}
                disabled={isPending}
                className="text-xs text-tx4 hover:text-danger underline underline-offset-2"
              >
                {t('undo')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isPending}
              className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {t('markAsPaid')}
            </button>
          )}
        </div>
      </div>

      {/* Paid notes */}
      {contributor.status === 'paid' && contributor.notes && (
        <div className="border-t border-border px-4 py-2 sm:px-5">
          <p className="text-xs text-tx3">{t('ref')}: {contributor.notes}</p>
        </div>
      )}

      {/* Expanded post list */}
      {expanded && (
        <ul className="border-t border-border divide-y divide-border">
          {contributor.posts.map((post) => (
            <li key={post.id} className="flex items-start gap-3 px-4 py-2.5 sm:px-5">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/posts/${post.slug}`}
                  className="block truncate text-sm text-tx hover:text-saffron-700 dark:hover:text-saffron-400"
                >
                  {post.title}
                </Link>
                <p className="mt-0.5 text-xs text-tx4">
                  {tCat(catKey(post.category))} · ₹{rates[post.category] ?? 0} · {post.totalViews} {t('views')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Confirm payment modal */}
      <Modal open={showConfirm} onClose={handleClose} title={t('confirmPaymentTitle')}>
        <p className="mb-4 text-sm text-tx3">{t('confirmPaymentMessage')}</p>

        {/* Contributor name + amount summary */}
        <div className="mb-4 rounded-lg border border-border bg-surface-2 px-4 py-3">
          <p className="mb-2 text-sm font-semibold text-tx">{contributor.displayName}</p>
          <div className="space-y-0.5">
            {Object.entries(byCategory).map(([slug, count]) => (
              <p key={slug} className="text-xs text-tx3">
                {tCat(catKey(slug))} × {count} = <span className="font-medium text-tx">₹{count * (rates[slug] ?? 0)}</span>
              </p>
            ))}
            <p className="mt-1.5 border-t border-border/50 pt-1.5 text-sm font-bold text-tx">
              {t('total')}: ₹{amount}
            </p>
          </div>
        </div>

        {/* Notes */}
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('notesPlaceholder')}
          className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-saffron-500"
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={handleClose} disabled={isPending} className="w-full sm:w-auto">
            {t('cancel')}
          </Button>
          <Button
            onClick={handleMarkPaid}
            loading={isPending}
            className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
          >
            {t('confirmPaymentAction')} · ₹{amount}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const t = useTranslations('payouts')
  const tCat = useTranslations('categories')
  const [month, setMonth] = useState(currentMonth)
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES)
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [data, setData] = useState<PayoutsData | null>(null)
  const [outstanding, setOutstanding] = useState<OutstandingMonth[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSavingRates, setIsSavingRates] = useState(false)
  const [ratesSaved, setRatesSaved] = useState(false)
  const dataRef = useRef<HTMLDivElement>(null)

  const handleSelectMonth = (m: string) => {
    setMonth(m)
    setTimeout(() => dataRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const loadData = useCallback(() => {
    startTransition(async () => {
      const result = await getPayoutsData(month)
      setData(result)
    })
  }, [month])

  useEffect(() => { loadData() }, [loadData])

  // Load outstanding + saved rates on mount
  useEffect(() => {
    getOutstandingPayments().then(setOutstanding)
    getPayoutRates().then((r) => { setRates(r); setRatesLoaded(true) })
  }, [])

  const handleSaveRates = async () => {
    setIsSavingRates(true)
    await savePayoutRates(rates)
    setIsSavingRates(false)
    setRatesSaved(true)
    setTimeout(() => setRatesSaved(false), 2000)
  }

  const pendingContributors = data?.contributors.filter((c) => c.status === 'pending') ?? []
  const paidContributors = data?.contributors.filter((c) => c.status === 'paid') ?? []
  const totalAmountDue = pendingContributors.reduce((s, c) => s + calcAmount(c.posts, rates), 0)

  const updateRate = (slug: string, value: number) =>
    setRates((prev) => ({ ...prev, [slug]: Math.max(0, value) }))

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-tx">{t('title')}</h1>

      {/* Outstanding payments across all months */}
      {outstanding && outstanding.length > 0 && (
        <OutstandingSection
          outstanding={outstanding}
          rates={rates}
          onSelectMonth={handleSelectMonth}
        />
      )}

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-tx3">{t('month')}</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-saffron-500"
          >
            {monthOptions().map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {isPending && <p className="pb-2 text-xs text-tx4">{t('loading')}</p>}
      </div>

      {ratesLoaded && (
      <>
      {/* Per-category rates */}
      <div ref={dataRef} className="mb-6 rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-tx3">{t('ratesTitle')}</p>
          <button
            onClick={handleSaveRates}
            disabled={isSavingRates || ratesSaved}
            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-tx2 hover:bg-surface-2 disabled:opacity-60 transition-colors"
          >
            {isSavingRates ? t('saving') : ratesSaved ? `✓ ${t('ratesSaved')}` : t('saveRates')}
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.slug}>
              <label className="mb-1 block text-xs text-tx3">{tCat(cat.nameKey)}</label>
              <div className="flex items-center rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-saffron-500">
                <span className="mr-1 text-xs text-tx3">₹</span>
                <input
                  type="number"
                  min={0}
                  value={rates[cat.slug]}
                  onChange={(e) => updateRate(cat.slug, Number(e.target.value))}
                  className="w-16 bg-transparent text-sm text-tx focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-5">
              <p className="text-2xl font-bold text-tx sm:text-3xl">{data.contributors.length}</p>
              <p className="mt-1 text-xs text-tx3 sm:text-sm">{t('contributors')}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-5">
              <p className="text-2xl font-bold text-tx sm:text-3xl">{data.totalPosts}</p>
              <p className="mt-1 text-xs text-tx3 sm:text-sm">{t('approvedPosts')}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-5">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 sm:text-3xl">₹{totalAmountDue}</p>
              <p className="mt-1 text-xs text-tx3 sm:text-sm">{t('amountDue')} ({pendingContributors.length} {t('pending')})</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-5">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 sm:text-3xl">₹{data.totalPaid}</p>
              <p className="mt-1 text-xs text-tx3 sm:text-sm">{t('amountPaid')} ({paidContributors.length} {t('paid')})</p>
            </div>
          </div>

          {/* Pending payments */}
          {pendingContributors.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-tx2">{t('pendingPayments')} ({pendingContributors.length})</h2>
              {pendingContributors.map((c) => (
                <ContributorCard
                  key={c.userId}
                  contributor={c}
                  month={month}
                  rates={rates}
                  onRefresh={loadData}
                />
              ))}
            </div>
          )}

          {/* Paid */}
          {paidContributors.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-tx2">{t('completedPayments')} ({paidContributors.length})</h2>
              {paidContributors.map((c) => (
                <ContributorCard
                  key={c.userId}
                  contributor={c}
                  month={month}
                  rates={rates}
                  onRefresh={loadData}
                />
              ))}
            </div>
          )}

          {data.contributors.length === 0 && (
            <p className="text-sm text-tx3">{t('noContributors')}</p>
          )}
        </div>
      )}
      </>
      )}
    </div>
  )
}
