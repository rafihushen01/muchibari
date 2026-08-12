'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminGate } from '@/components/admin-gate'

function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [error, setError] = useState('')
  useEffect(() => { api.products.list().then(setProducts).catch((err) => setError(err.message)) }, [])
  return <main className="min-h-screen bg-[#FAF5EF] p-6"><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-3"><Link href="/admin" className="text-sm text-[#AD3735] hover:underline">← Back</Link><h1 className="text-2xl font-bold text-[#AD3735]">Products</h1></div><Link href="/admin/products/new" className="rounded-lg bg-[#AD3735] px-4 py-2 text-sm font-medium text-white">+ Add Product</Link></div>{error && <p className="mb-3 text-sm text-red-500">{error}</p>}<div className="overflow-hidden rounded-xl bg-white shadow-sm">{!products.length ? <p className="p-8 text-center text-gray-400">No products yet.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-[#FAF5EF]"><tr><th className="px-3 py-3 text-left text-[#AD3735]">Product</th><th className="px-3 py-3 text-center text-[#AD3735]">Price</th><th className="px-3 py-3 text-center text-[#AD3735]">Stock</th><th className="px-3 py-3 text-right text-[#AD3735]">Action</th></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-b"><td className="px-3 py-3"><div className="flex items-center gap-2">{product.image_url && <img src={product.image_url} alt="" className="h-9 w-9 rounded-lg object-cover"/>}<div><p className="font-semibold text-[#AD3735]">{product.name}</p><p className="text-xs text-gray-400">{product.categories?.name ?? '—'}</p></div></div></td><td className="px-3 py-3 text-center">৳{product.price}</td><td className="px-3 py-3 text-center">{product.in_stock ? 'In Stock' : 'Out'}</td><td className="px-3 py-3 text-right"><Link href={`/admin/products/${product.id}/edit`} className="font-medium text-[#C4874A] hover:underline">Edit</Link></td></tr>)}</tbody></table></div>}</div></main>
}
export default function AdminProductsPage() { return <AdminGate><Products /></AdminGate> }
