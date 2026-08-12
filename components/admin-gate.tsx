'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, clearSession } from '@/lib/api'

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    api.auth.me()
      .then((user) => {
        if (user.is_admin) setAllowed(true)
        else router.replace('/')
      })
      .catch(() => {
        clearSession()
        router.replace('/auth/login')
      })
  }, [router])

  if (!allowed) return <div className="min-h-screen grid place-items-center bg-[#FAF5EF] text-gray-500">Checking access…</div>
  return <>{children}</>
}
