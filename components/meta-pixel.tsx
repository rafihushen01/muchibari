'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initMetaPixel, trackPageView } from '@/lib/analytics/meta'

export function MetaPixel() {
  const pathname = usePathname()

  useEffect(() => {
    initMetaPixel()
    trackPageView(pathname)
  }, [pathname])

  return null
}