'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AdminGate } from '@/components/admin-gate'

function Settings() {
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.auth.me().then((user) => setEmail(user.email)).catch((err) => setError(err.message)) }, [])

  async function saveCredentials() {
    if (!currentPassword || (!newPassword && !email)) return
    try {
      setSaving(true); setError(''); setMessage('')
      const session = await api.auth.credentials(currentPassword, { email, newPassword: newPassword || undefined })
      setEmail(session.user.email); setCurrentPassword(''); setNewPassword('')
      setMessage('Credentials updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Could not update credentials.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="min-h-screen bg-[#FAF5EF] p-6">
    <div className="mb-6 flex items-center gap-3"><Link href="/admin" className="text-sm text-[#AD3735] hover:underline">← Back</Link><h1 className="text-2xl font-bold text-[#AD3735]">Account Settings</h1></div>
    <div className="max-w-md rounded-xl bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm text-gray-500">Update your admin email or password. Your current password is required.</p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}{message && <p className="mb-3 text-sm text-green-700">{message}</p>}
      <div className="space-y-3">
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-lg border p-2" />
        <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" className="w-full rounded-lg border p-2" />
        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password (optional)" className="w-full rounded-lg border p-2" />
        <button onClick={saveCredentials} disabled={saving || !currentPassword} className="w-full rounded-lg bg-[#AD3735] px-4 py-2 font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>
  </main>
}

export default function AdminSettingsPage() {
  return <AdminGate><Settings /></AdminGate>
}
