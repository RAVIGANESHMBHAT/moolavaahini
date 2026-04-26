import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPaymentReceipt } from '@/actions/payouts.actions'
import { CATEGORIES } from '@/lib/categories'
import { ReceiptDocument } from '@/components/payouts/ReceiptDocument'
import PrintButton from './PrintButton'

type PageProps = { params: Promise<{ paymentId: string }> }

export default async function ReceiptPage({ params }: PageProps) {
  const { paymentId } = await params
  const [receipt, tCat] = await Promise.all([
    getPaymentReceipt(paymentId),
    getTranslations('categories'),
  ])

  if (!receipt) notFound()

  function getCatName(slug: string) {
    const nameKey = CATEGORIES.find((c) => c.slug === slug)?.nameKey ?? slug
    return tCat(nameKey as Parameters<typeof tCat>[0])
  }

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 18mm 16mm; }
          body { background: #fff !important; color: #000 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="py-8 print:py-0">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <span className="text-sm text-tx3">
            Receipt · {receipt.paymentId.slice(0, 8).toUpperCase()}
          </span>
          <PrintButton label="Print / Save as PDF" />
        </div>

        <div className="mx-auto max-w-2xl print:max-w-none">
          <ReceiptDocument receipt={receipt} getCatName={getCatName} />
        </div>
      </div>
    </>
  )
}
