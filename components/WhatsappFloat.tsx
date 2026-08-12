'use client'
import { usePathname } from 'next/navigation'
import { FaWhatsapp } from 'react-icons/fa'
import { getWhatsAppLink } from '@/lib/data'

export default function WhatsAppFloat() {
  const pathname = usePathname() ?? ''
  if (pathname.startsWith('/admin')) return null

  return (
    <a href={getWhatsAppLink("Hi, I'm interested in your products")}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'fixed', bottom: '135px', right: '16px' }}
      className="bg-white rounded-full shadow-lg p-2 flex items-center justify-center">
      <FaWhatsapp style={{ color: '#25D366' }} size={28} />
    </a>
  )
}