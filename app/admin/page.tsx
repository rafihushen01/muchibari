'use client'

import Link from 'next/link'
import { AdminGate } from '@/components/admin-gate'

const links = [
  { label: 'Products', href: '/admin/products', emoji: '👟' },
  { label: 'Categories', href: '/admin/categories', emoji: '📁' },
  { label: 'Orders', href: '/admin/orders', emoji: '📦' },
  { label: 'Reviews', href: '/admin/reviews', emoji: '⭐' },
  { label: 'Banner', href: '/admin/banners', emoji: '🖼️' },
  { label: 'Settings', href: '/admin/settings', emoji: '⚙️' },
]

export default function AdminPage() {
  return <AdminGate><main className="min-h-screen bg-[#FAF5EF] p-6"><h1 className="mb-8 text-2xl font-bold text-[#AD3735]">Admin Dashboard</h1><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{links.map((item) => <Link key={item.href} href={item.href} className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"><span className="text-4xl">{item.emoji}</span><span className="font-semibold text-[#AD3735]">{item.label}</span></Link>)}</div></main></AdminGate>
}
