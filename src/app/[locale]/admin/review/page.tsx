import { ReviewQueue } from '@/components/admin/ReviewQueue'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Review Queue' }

export default async function ReviewPage() {
  const t = await getTranslations('admin')
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-tx">{t('reviewQueue')}</h1>
      <ReviewQueue />
    </div>
  )
}
