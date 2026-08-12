'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export default function AdminSettingsForm({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function handleEmailChange() {
    setMsg('For security, email changes require a current-password flow. Contact an administrator.')
  }

  async function handlePasswordChange() {
    setMsg('Enter your current password through the profile security flow before updating credentials.')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-sm text-gray-500 mb-2">Current email: {currentEmail}</p>
        
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border rounded-lg p-2 w-full mb-2"
        />
        <button onClick={handlePasswordChange} className="bg-[#AD3735] text-white px-4 py-2 rounded-lg">
          Update Password
        </button>
      </div>

      {msg && <p className="text-sm text-[#AD3735]">{msg}</p>}
    </div>
  )
}
