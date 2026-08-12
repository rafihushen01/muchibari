'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function DeleteReviewButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this review?')) return
    await api.reviews.remove(id)
    router.refresh()
  }

  return (
    <button onClick={handleDelete}
      className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
      Delete
    </button>
  )
}
