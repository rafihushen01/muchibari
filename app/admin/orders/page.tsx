'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminGate } from '@/components/admin-gate'

function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  async function loadOrders() {
    try {
      setError('')
      setOrders(await api.orders.list())
    } catch (err: any) {
      setError(err.message || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  async function changeStatus(orderId: string, status: string) {
    try {
      setUpdatingId(orderId)
      const result: any = await api.orders.status(orderId, status)
      setOrders((current) => current.map((order) => order.id === orderId ? result.order : order))
    } catch (err: any) {
      setError(err.message || 'Could not update the order status.')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF5EF] p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-[#AD3735] hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold text-[#AD3735]">Orders</h1>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-gray-500">Loading orders…</p> : !orders.length ? (
        <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm">No orders yet.</div>
      ) : <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-gray-800">Order #{order?.order_number}</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                <p className="mt-2 text-sm text-gray-600">Customer: {order.profiles?.full_name ?? order.guest_name ?? 'Guest'}</p>
                <p className="text-sm text-gray-600">Phone: {order.phone}</p>
                <p className="text-sm text-gray-600">Address: {order.address}</p>
                <p className="mt-1 text-xs text-gray-400">{order.delivery_zone} · Delivery ৳{order.delivery_charge}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#AD3735]">৳{order.total}</p>
                <select value={order.status} disabled={updatingId === order.id} onChange={(event) => changeStatus(order.id, event.target.value)} className="mt-2 rounded-lg border border-gray-300 px-2 py-1 text-xs disabled:opacity-50">
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2 border-t pt-3">
              {order.order_items?.map((item: any) => <div key={item.id} className="flex items-center gap-3 text-sm text-gray-600">
                {item.products?.image_url && <img src={item.products.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                <span>{item.products?.name ?? 'Product'} × {item.quantity} — ৳{item.price * item.quantity}</span>
              </div>)}
            </div>
          </article>
        ))}
      </div>}
    </main>
  )
}

export default function AdminOrdersPage() {
  return <AdminGate><Orders /></AdminGate>
}
