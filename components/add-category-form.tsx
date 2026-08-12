'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function AddCategoryForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleAdd() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    try {
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      const image_url = imageFile ? (await api.uploadImages([imageFile], 'categories'))[0].url : ''
      await api.categories.create({ name, slug, image_url })
      setName('')
      setImageFile(null)
      setImagePreview('')
      window.dispatchEvent(new Event('muchi-bari-admin-data-change'))
      router.refresh()
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-semibold text-gray-700 mb-4">Add New Category</h2>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4874A]"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Image
            <span className="text-gray-400 font-normal ml-1">optional</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview"
              className="mt-2 w-16 h-16 object-cover rounded-lg" />
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={loading || !name.trim()}
          className="w-full bg-[#AD3735] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#C4874A] transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Category'}
        </button>
      </div>
    </div>
  )
}
