import { ReviewQueue } from '@/components/admin/ReviewQueue'

export const metadata = { title: 'Review Queue' }

export default function ReviewPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-tx">Review Queue</h1>
      <ReviewQueue />
    </div>
  )
}
