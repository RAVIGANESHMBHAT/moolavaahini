import { getSession } from '@/lib/auth'
import { FloatingWriteButtonUI } from './FloatingWriteButtonUI'

export async function FloatingWriteButton() {
  const user = await getSession()
  if (!user) return null
  return <FloatingWriteButtonUI />
}
