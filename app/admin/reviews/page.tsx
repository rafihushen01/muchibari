'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminGate } from '@/components/admin-gate'

function Reviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    api.reviews.list().then(setReviews).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [])

  async function toggleApproval(review: any) {
    try {
      setBusyId(review.id); setError('')
      const result: any = await api.reviews.approval(review.id, !review.approved)
      setReviews((current) => current.map((item) => item.id === review.id ? result.review : item))
    } catch (err: any) { setError(err.message || 'Could not update this review.') } finally { setBusyId('') }
  }

  async function removeReview(id: string) {
    if (!confirm('Delete this review?')) return
    try {
      setBusyId(id); setError('')
      await api.reviews.remove(id)
      setReviews((current) => current.filter((item) => item.id !== id))
    } catch (err: any) { setError(err.message || 'Could not delete this review.') } finally { setBusyId('') }
  }

  return <main className="min-h-screen bg-[#FAF5EF] p-6">
    <div className="mb-6 flex items-center gap-3"><Link href="/admin" className="text-sm text-[#AD3735] hover:underline">← Back</Link><h1 className="text-2xl font-bold text-[#AD3735]">Reviews</h1></div>
    {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
    {loading ? <p className="text-gray-500">Loading reviews…</p> : !reviews.length ? <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm">No reviews yet.</div> : <div className="space-y-4">
      {reviews.map((review) => <article key={review.id} className="rounded-xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-gray-800">{review.profiles?.full_name ?? 'Anonymous'}</p><p className="mt-1 text-xs text-gray-400">Product: {review.products?.name ?? review.product_id}</p><p className="mt-1 text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p><p className="mt-2 text-sm text-gray-600">{review.comment}</p><p className="mt-2 text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p></div><div className="flex shrink-0 flex-col gap-2"><button disabled={busyId === review.id} onClick={() => toggleApproval(review)} className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${review.approved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{review.approved ? 'Approved' : 'Approve'}</button><button disabled={busyId === review.id} onClick={() => removeReview(review.id)} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50">Delete</button></div></div></article>)}
    </div>}
  </main>
}

export default function AdminReviewsPage() { return <AdminGate><Reviews /></AdminGate> }
