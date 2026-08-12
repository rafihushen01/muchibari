'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminGate } from '@/components/admin-gate'

function Banners() {
  const [mobile, setMobile] = useState<File | null>(null); const [desktop, setDesktop] = useState<File | null>(null)
  const [current, setCurrent] = useState<any>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(false)
  useEffect(() => { api.banner.get().then(setCurrent).catch((err) => setError(err.message)) }, [])
  async function save() { if (!mobile && !desktop) return; setLoading(true); setError(''); setSuccess(false); try { const updates: Record<string, string> = {}; if (mobile) updates.mobile_image_url = (await api.uploadImages([mobile], 'banners'))[0].url; if (desktop) updates.desktop_image_url = (await api.uploadImages([desktop], 'banners'))[0].url; const result: any = await api.banner.update(updates); setCurrent(result.banner); setMobile(null); setDesktop(null); setSuccess(true) } catch (err: any) { setError(err.message) } finally { setLoading(false) } }
  return <main className="min-h-screen bg-[#FAF5EF] p-6"><div className="mb-6 flex items-center gap-3"><Link href="/admin" className="text-sm text-[#AD3735] hover:underline">← Back</Link><h1 className="text-2xl font-bold text-[#AD3735]">Hero Banner</h1></div><div className="max-w-2xl rounded-xl bg-white p-6 shadow-sm">{error && <p className="mb-4 text-sm text-red-500">{error}</p>}{success && <p className="mb-4 text-sm text-green-600">Banner updated successfully.</p>}{[['Mobile banner', 'mobileImageUrl', mobile, setMobile], ['Desktop banner', 'desktopImageUrl', desktop, setDesktop]].map(([label, key, file, setter]: any) => <div key={key} className="mb-6"><p className="mb-2 font-medium">{label}</p>{current?.[key] && <img src={current[key]} alt="Current banner" className="mb-3 h-32 w-full rounded-lg object-cover"/>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setter(e.target.files?.[0] ?? null)} />{file && <p className="mt-1 text-sm text-gray-500">{file.name}</p>}</div>)}<button onClick={save} disabled={loading || (!mobile && !desktop)} className="w-full rounded-lg bg-[#AD3735] py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Uploading…' : 'Save Banner'}</button></div></main>
}
export default function AdminBannersPage() { return <AdminGate><Banners /></AdminGate> }
