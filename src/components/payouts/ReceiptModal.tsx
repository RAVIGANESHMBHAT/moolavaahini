'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { getPaymentReceipt, type PaymentReceipt } from '@/actions/payouts.actions'
import { CATEGORIES } from '@/lib/categories'
import { ReceiptDocument } from './ReceiptDocument'

interface Props {
  paymentId: string
  label: string
}

export function ReceiptModal({ paymentId, label }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)
  const printOverlayRef = useRef<HTMLDivElement | null>(null)
  const printStyleRef = useRef<HTMLStyleElement | null>(null)

  const cleanupPrint = useCallback(() => {
    if (printOverlayRef.current && document.body.contains(printOverlayRef.current)) {
      document.body.removeChild(printOverlayRef.current)
    }
    if (printStyleRef.current && document.head.contains(printStyleRef.current)) {
      document.head.removeChild(printStyleRef.current)
    }
    printOverlayRef.current = null
    printStyleRef.current = null
  }, [])

  const handleClose = () => {
    cleanupPrint()
    setOpen(false)
  }
  const tCat = useTranslations('categories')

  function getCatName(slug: string) {
    const nameKey = CATEGORIES.find((c) => c.slug === slug)?.nameKey ?? slug
    return tCat(nameKey as Parameters<typeof tCat>[0])
  }

  const handleOpen = async () => {
    setOpen(true)
    if (!receipt) {
      setLoading(true)
      const data = await getPaymentReceipt(paymentId)
      setReceipt(data)
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!receiptRef.current) return

    cleanupPrint() // remove any leftover from a previous print

    const overlay = document.createElement('div')
    overlay.setAttribute('data-receipt-print', '')
    overlay.innerHTML = receiptRef.current.innerHTML
    document.body.appendChild(overlay)
    printOverlayRef.current = overlay

    const style = document.createElement('style')
    style.textContent = `
      @media print {
        @page { margin: 18mm 16mm; }
        body { visibility: hidden !important; }
        [data-receipt-print] {
          visibility: visible !important;
          position: absolute;
          inset: 0;
          background: white;
          padding: 24px;
        }
        [data-receipt-print] * {
          visibility: visible !important;
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `
    document.head.appendChild(style)
    printStyleRef.current = style

    window.print()

    window.addEventListener('afterprint', cleanupPrint, { once: true })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-tx3 hover:text-tx underline underline-offset-2"
      >
        {label}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:inset-8 md:inset-x-[8%] md:inset-y-8 lg:inset-x-[18%]">

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4">
              <h2 className="text-base font-semibold text-tx">Payment Receipt</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  disabled={!receipt}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-tx2 hover:bg-surface-2 disabled:opacity-40"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9v-2h8v2H6zm-2-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                  </svg>
                  Print / Save as PDF
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-tx4 hover:bg-surface-2 hover:text-tx"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable receipt body */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-6 dark:bg-slate-800">
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-saffron-600" />
                </div>
              ) : receipt ? (
                <div ref={receiptRef}>
                  <ReceiptDocument receipt={receipt} getCatName={getCatName} />
                </div>
              ) : (
                <p className="mt-12 text-center text-sm text-tx3">Could not load receipt.</p>
              )}
            </div>

          </div>
        </>
      )}
    </>
  )
}
