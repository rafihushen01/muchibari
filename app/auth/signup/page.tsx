'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { trackCompleteRegistration } from '@/lib/analytics/meta'
// new deployment
export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)
    setError('')
    try {
      await api.auth.register(fullName, email, password)
      trackCompleteRegistration('email')
      router.push('/')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF5EF]">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#AD3735] mb-6">Create Account</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none"
        />
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-[#AD3735] text-white py-2 rounded-lg hover:bg-[#C4874A] transition"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <p className="text-center text-sm mt-4 text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#C4874A] hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
