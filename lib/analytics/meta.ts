export type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'

type MetaData = Record<string, string | number | boolean | string[] | undefined>
type Fbq = (command: 'init' | 'track', event: string, data?: MetaData, options?: { eventID?: string }) => void

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
let initialized = false
const sentPageViews = new Set<string>()

function getFbq() {
  return typeof window !== 'undefined' ? window.fbq : undefined
}

function eventId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

function track(eventName: MetaEventName, data: MetaData = {}, id = eventId(eventName.toLowerCase())) {
  const fbq = getFbq()
  if (!fbq || !pixelId) return id
  fbq('track', eventName, data, { eventID: id })
  return id
}

export function initMetaPixel() {
  if (typeof window === 'undefined' || initialized || !pixelId) return
  const queue: Fbq & { queue?: unknown[]; loaded?: boolean; version?: string } = window.fbq ?? ((...args: Parameters<Fbq>) => {
    ;(queue.queue ??= []).push(args)
  })
  queue.loaded = true
  queue.version = '2.0'
  window.fbq = queue
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
  const fbq = queue
  fbq('init', pixelId)
  initialized = true
}

export function trackPageView(pathname: string) {
  initMetaPixel()
  const key = pathname || '/'
  if (sentPageViews.has(key)) return
  sentPageViews.add(key)
  const fbq = getFbq()
  if (!fbq || !pixelId) return
  fbq('track', 'PageView', {}, { eventID: eventId('pageview') })
}

export function trackViewContent(product: { id: string; name: string; price: number; category?: string }) {
  return track('ViewContent', { content_ids: [product.id], content_name: product.name, content_type: 'product', value: product.price, currency: 'BDT', category: product.category })
}

export function trackSearch(searchString: string) {
  return track('Search', { search_string: searchString })
}

export function trackAddToCart(item: { id: string; name: string; price: number; quantity: number }) {
  return track('AddToCart', { content_ids: [item.id], content_name: item.name, content_type: 'product', value: item.price * item.quantity, currency: 'BDT' })
}

export function trackInitiateCheckout(data: { contentIds: string[]; value: number; numItems: number }) {
  return track('InitiateCheckout', { content_ids: data.contentIds, content_type: 'product', value: data.value, num_items: data.numItems, currency: 'BDT' })
}

export function trackAddPaymentInfo() {
  return track('AddPaymentInfo', {})
}

export function trackPurchase(orderId: string, value: number) {
  return track('Purchase', { content_type: 'product', value, currency: 'BDT', order_id: orderId }, `purchase_${orderId}`)
}

export function getMetaBrowserIdentifiers() {
  if (typeof document === 'undefined') return {}
  const cookies = document.cookie.split(';').map((value) => value.trim())
  const get = (name: string) => cookies.find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1)
  return { fbp: get('_fbp'), fbc: get('_fbc') }
}
