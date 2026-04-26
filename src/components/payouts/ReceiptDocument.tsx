import type { PaymentReceipt } from '@/actions/payouts.actions'

interface Props {
  receipt: PaymentReceipt
  getCatName: (slug: string) => string
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ReceiptDocument({ receipt, getCatName }: Props) {
  const receiptNo = receipt.paymentId.slice(0, 8).toUpperCase()

  // Group posts by category for line items
  const byCategory: Record<string, { count: number; rate: number; subtotal: number }> = {}
  for (const p of receipt.posts) {
    if (!byCategory[p.category]) byCategory[p.category] = { count: 0, rate: p.rate, subtotal: 0 }
    byCategory[p.category].count++
    byCategory[p.category].subtotal += p.rate
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm">

      {/* ── Top band ── */}
      <div className="px-8 py-6" style={{ backgroundColor: '#d97706' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#fef3c7' }}>
              Moolavaahini
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">Payment Receipt</h1>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium" style={{ color: '#fde68a' }}>Receipt No.</p>
            <p className="font-mono text-lg font-bold text-white">{receiptNo}</p>
            <p className="mt-0.5 text-xs" style={{ color: '#fde68a' }}>{formatDateShort(receipt.paidAt)}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">

        {/* ── Paid to / Period ── */}
        <div className="mb-8 grid grid-cols-2 gap-6 border-b border-gray-200 pb-8">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Paid to</p>
            <p className="text-lg font-bold text-gray-900">{receipt.contributorName}</p>
            <p className="mt-0.5 text-xs text-gray-500">Content Contributor</p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Payment period</p>
            <p className="text-base font-semibold text-gray-900">{monthLabel(receipt.month)}</p>
            <p className="mt-0.5 text-xs text-gray-500">Payment date: {formatDate(receipt.paidAt)}</p>
            {receipt.notes && (
              <p className="mt-0.5 text-xs text-gray-500">Ref: {receipt.notes}</p>
            )}
          </div>
        </div>

        {/* ── Line items ── */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="pb-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">#</th>
                <th className="pb-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Description</th>
                <th className="pb-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500">Qty</th>
                <th className="pb-2 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Unit Rate</th>
                <th className="pb-2 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCategory).map(([slug, { count, rate, subtotal }], i) => (
                <tr key={slug} className="border-b border-gray-100">
                  <td className="py-3 text-gray-400">{i + 1}</td>
                  <td className="py-3 font-medium text-gray-900">
                    {getCatName(slug)}
                    <span className="ml-2 text-xs text-gray-400">content</span>
                  </td>
                  <td className="py-3 text-center text-gray-700">{count}</td>
                  <td className="py-3 text-right text-gray-700">₹{rate}</td>
                  <td className="py-3 text-right font-semibold text-gray-900">₹{subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Totals ── */}
        <div className="mb-8 flex justify-end">
          <div className="w-64">
            <div className="flex justify-between border-b border-gray-200 py-2 text-sm">
              <span className="text-gray-500">Subtotal ({receipt.posts.length} posts)</span>
              <span className="font-medium text-gray-900">₹{receipt.amount}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-500">Tax / Deductions</span>
              <span className="text-gray-400">—</span>
            </div>
            <div className="mt-1 flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#fef3c7' }}>
              <span className="text-sm font-bold" style={{ color: '#78350f' }}>Total Paid</span>
              <span className="text-xl font-bold" style={{ color: '#b45309' }}>₹{receipt.amount}</span>
            </div>
          </div>
        </div>

        {/* ── Payment complete badge ── */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-2" style={{ borderColor: '#16a34a' }}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="#16a34a">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#16a34a' }}>Payment Complete</span>
          </div>
        </div>

        {/* ── Individual post list ── */}
        {receipt.posts.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-100 p-4" style={{ backgroundColor: '#f9fafb' }}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Approved Posts — {monthLabel(receipt.month)}
            </p>
            <ul className="space-y-1.5">
              {receipt.posts.map((post, i) => (
                <li key={post.slug} className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 shrink-0 text-gray-300">{String(i + 1).padStart(2, '0')}.</span>
                  <span className="flex-1 text-gray-700">{post.title}</span>
                  <span className="shrink-0 text-gray-400">{getCatName(post.category)}</span>
                  <span className="w-10 shrink-0 text-right font-medium text-gray-600">₹{post.rate}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-[10px] text-gray-400">
            Moolavaahini Cultural Knowledge Platform · Receipt #{receiptNo}
          </p>
        </div>

      </div>
    </div>
  )
}
