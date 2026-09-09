export type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'

type MetaData = Record<string, string | number | boolean | string[] | Array<Record<string, string | number>> | undefined>

type Fbq = (
  ...args:
    | [command: 'init' | 'track', event: string, data?: MetaData, options?: { eventID?: string }]
    | [command: 'set', property: string, value: unknown, pixelId?: string]
) => void

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
  initMetaPixel()
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[Meta Pixel]', eventName, { event_id: id, payload: data })
  }
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
  fbq('set', 'autoConfig', false, pixelId)
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
  return track('ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    contents: [{ id: product.id, quantity: 1, item_price: product.price }],
    value: product.price,
    currency: 'BDT',
    category: product.category,
  })
}

export function trackSearch(searchString: string) {
  return track('Search', { search_string: searchString })
}

export function trackAddToCart(item: { id: string; name: string; price: number; quantity: number }) {
  return track('AddToCart', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    contents: [{ id: item.id, quantity: item.quantity, item_price: item.price }],
    value: item.price * item.quantity,
    currency: 'BDT',
    num_items: item.quantity,
  })
}

export function trackInitiateCheckout(data: { contentIds: string[]; contents: Array<{ id: string; quantity: number; item_price: number }>; value: number; numItems: number }) {
  return track('InitiateCheckout', {
    content_ids: data.contentIds,
    contents: data.contents,
    content_type: 'product',
    value: data.value,
    num_items: data.numItems,
    currency: 'BDT',
  })
}

export function trackAddPaymentInfo() {
  return track('AddPaymentInfo', {})
}

export function trackPurchase(orderId: string, value: number, contents: Array<{ id: string; quantity: number; item_price: number }> = []) {
  return track('Purchase', {
    content_ids: contents.map((item) => item.id),
    contents,
    content_type: 'product',
    value,
    currency: 'BDT',
    order_id: orderId,
  }, `purchase_${orderId}`)
}

export function getMetaBrowserIdentifiers() {
  if (typeof document === 'undefined') return {}
  const cookies = document.cookie.split(';').map((value) => value.trim())
  const get = (name: string) => cookies.find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1)
  return { fbp: get('_fbp'), fbc: get('_fbc') }
}