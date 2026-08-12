'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface EditCategoryImageProps {
  categoryId: string
  currentImageUrl?: string | null
}

export function EditCategoryImageButton({ categoryId, currentImageUrl }: EditCategoryImageProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      const file = files[0]
      const [image] = await api.uploadImages([file], 'categories')
      await api.categories.update(categoryId, { image_url: image.url })
      window.dispatchEvent(new Event('muchi-bari-admin-data-change'))

      // Refresh server components to display update
      router.refresh()
    } catch (error) {
      console.error('Error changing image:', error)
      alert('Failed to update image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentImageUrl ? (
        <img 
          src={currentImageUrl} 
          alt="Category thumbnail" 
          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
        />
      ) : (
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
          No Img
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/jpeg,image/png,image/webp" 
        className="hidden" 
      />
      
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-1 py-0.5 rounded-md transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Edit'}
      </button>
    </div>
  )
}
