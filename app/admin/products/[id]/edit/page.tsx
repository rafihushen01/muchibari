'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { AdminGate } from '@/components/admin-gate'
import { EditProductForm } from '@/components/edit-product-form'

function EditProduct() { const { id } = useParams<{ id: string }>(); const router = useRouter(); const [product, setProduct] = useState<any>(); const [categories, setCategories] = useState<any[]>([]); const [error, setError] = useState(''); useEffect(() => { Promise.all([api.products.get(id), api.categories.list()]).then(([item, cats]) => { setProduct(item); setCategories(cats) }).catch((err) => setError(err.message)) }, [id]); if (error) return <p className="p-6 text-red-500">{error}</p>; if (!product) return <p className="p-6">Loading…</p>; return <main className="min-h-screen bg-[#FAF5EF] p-6"><div className="mb-6 flex gap-3"><Link href="/admin/products" className="text-[#AD3735]">← Back</Link><h1 className="text-2xl font-bold text-[#AD3735]">Edit Product</h1></div><EditProductForm product={product} categories={categories}/></main> }
export default function EditProductPage() { return <AdminGate><EditProduct /></AdminGate> }
