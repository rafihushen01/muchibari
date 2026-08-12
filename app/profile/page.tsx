'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getStoredUser } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const localUser = getStoredUser()
    if (!localUser) { router.push('/auth/login'); return }
    setUser(localUser)
    api.auth.me().then(async (current) => { setProfile(current); setFullName(current.full_name ?? ''); setPhone(current.phone ?? ''); setAddress(current.address ?? ''); setOrders(await api.orders.mine()) }).catch(() => router.push('/auth/login'))
  }, [])

  async function handleSave() {
    setLoading(true)
    try { const updated = await api.users.updateMe({ full_name: fullName, phone, address }); setUser(updated); setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2000) } catch { setLoading(false) }
  }

  async function handleLogout() {
    api.auth.logout()
    router.push('/')
  }

  if (!user) return null

  return (
    <div className="pb-24 bg-[#FAF5EF] min-h-screen">
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#AD3735]">My Profile</h1>
        <button onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 font-medium">
          Logout
        </button>
      </div>

      {/* Profile Info */}
      <div className="mx-4 mt-3 bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4">Personal Info</h2>
        <div className="space-y-3">
          <input type="text" placeholder="Full Name" value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4874A]" />
          <input type="text" placeholder="Phone" value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4874A]" />
          <textarea placeholder="Address" value={address}
            onChange={e => setAddress(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4874A]" />
          <button onClick={handleSave} disabled={loading}
            className="w-full bg-[#AD3735] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#C4874A] transition-colors disabled:opacity-50">
            {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Orders */}
      <div className="mx-4 mt-4">
        <h2 className="font-semibold text-gray-700 mb-3">My Orders</h2>
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 shadow-sm">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Order #{order.id}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{new Date(order.created_at).toLocaleDateString()}</p>
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 py-1">
                    {item.products?.image_url && (
                      <img src={item.products.image_url} alt={item.products.name}
                        className="w-8 h-8 rounded object-cover" />
                    )}
                    <span className="text-sm text-gray-700">{item.products?.name} × {item.quantity}</span>
                  </div>
                ))}
                <p className="text-sm font-bold text-[#AD3735] mt-2">Total: ৳{order.total}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
