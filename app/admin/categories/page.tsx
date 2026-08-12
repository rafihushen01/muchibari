'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminGate } from '@/components/admin-gate'
import { AddCategoryForm } from '@/components/add-category-form'
import { DeleteCategoryButton } from '@/components/delete-category-button'
import { EditCategoryImageButton } from '@/components/edit-category-image-button'
function Categories() { const [categories, setCategories] = useState<any[]>([]); const [error, setError] = useState(''); const load = () => api.categories.list().then(setCategories).catch((err) => setError(err.message)); useEffect(() => { load(); window.addEventListener('muchi-bari-admin-data-change', load); return () => window.removeEventListener('muchi-bari-admin-data-change', load) }, []); return <main className="min-h-screen bg-[#FAF5EF] p-6"><div className="mb-6 flex gap-3"><Link href="/admin" className="text-[#AD3735]">← Back</Link><h1 className="text-2xl font-bold text-[#AD3735]">Categories</h1></div><AddCategoryForm/>{error && <p className="mt-4 text-red-500">{error}</p>}<div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm"><table className="w-full text-sm"><thead className="bg-[#FAF5EF]"><tr><th className="p-4 text-left">Image</th><th className="p-4 text-left">Name</th><th className="p-4 text-left">Slug</th><th className="p-4 text-left">Actions</th></tr></thead><tbody>{categories.map((cat) => <tr key={cat.id} className="border-t"><td className="p-4"><EditCategoryImageButton categoryId={cat.id} currentImageUrl={cat.image_url}/></td><td className="p-4">{cat.name}</td><td className="p-4">{cat.slug}</td><td className="p-4"><DeleteCategoryButton id={cat.id}/></td></tr>)}</tbody></table></div></main> }
export default function AdminCategoriesPage() { return <AdminGate><Categories/></AdminGate> }
