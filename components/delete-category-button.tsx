'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function DeleteCategoryButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this category?')) return
    await api.categories.remove(id)
    window.dispatchEvent(new Event('muchi-bari-admin-data-change'))
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="text-red-400 hover:text-red-600 text-sm">
      Delete
    </button>
  )
}
