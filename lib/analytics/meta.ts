export type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
// final meta event update
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
let warnedMissingPixel = false
const sentPageViews = new Set<string>()

function getFbq() {
  return typeof window !== 'undefined' ? window.fbq : undefined
}

/**
 * Deterministic-looking event IDs only need to be unique per event, they are
 * NOT sent to Meta as secrets. crypto.randomUUID() only exists in secure
 * contexts (HTTPS / localhost), so fall back to a v4-style UUID on plain
 * HTTP or older browsers. Without this fallback every track() call throws
 * and the pixel silently fires zero events.
 */
function safeUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function eventId(prefix: string) {
  return `${prefix}_${safeUUID()}`
}

/**
 * Surface misconfiguration loudly instead of silently swallowing events.
 * The #1 reported bug ("only one event fires") is caused by the browser
 * pixel never initialising because NEXT_PUBLIC_META_PIXEL_ID is unset.
 */
function warnMissingPixel() {
  if (warnedMissingPixel || typeof window === 'undefined') return
  warnedMissingPixel = true
  console.warn(
    '[Meta Pixel] NEXT_PUBLIC_META_PIXEL_ID is not set. ' +
      'Browser events (PageView/ViewContent/AddToCart/InitiateCheckout/Purchase) will NOT fire. ' +
      'Add NEXT_PUBLIC_META_PIXEL_ID to the frontend environment (same value as backend META_DATASET_ID).',
  )
}

function track(eventName: MetaEventName, data: MetaData = {}, id = eventId(eventName.toLowerCase())) {
  if (!pixelId) {
    warnMissingPixel()
    return id
  }
  initMetaPixel()
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[Meta Pixel]', eventName, { event_id: id, payload: data })
  }
  const fbq = getFbq()
  if (!fbq) return id
  fbq('track', eventName, data, { eventID: id })
  return id
}

export function initMetaPixel() {
  if (typeof window === 'undefined') return
  if (!pixelId) {
    warnMissingPixel()
    return
  }
  if (initialized) return
  // fbevents.js may already be present on the page (another script loaded it).
  if (window.fbq && (window as { _fbq?: unknown })._fbq) {
    initialized = true
    return
  }

  // Official Meta bootstrap shape: fbq() pushes onto a queue while
  // fbevents.js is loading, then the loaded script replays the queue.
  // queue.queue MUST exist eagerly so the replay never races.
  const queue = ((...args: unknown[]) => {
    ;(queue as unknown as { queue: unknown[] }).queue.push(args)
  }) as unknown as Fbq & { queue: unknown[]; loaded?: boolean; version?: string; push?: Fbq }

  queue.queue = []
  queue.loaded = true
  queue.version = '2.0'
  queue.push = queue as unknown as Fbq
  window.fbq = queue
  window._fbq = queue

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  queue('set', 'autoConfig', false, pixelId)
  queue('init', pixelId)
  initialized = true
}

export function trackPageView(pathname: string) {
  if (!pixelId) {
    warnMissingPixel()
    return
  }
  initMetaPixel()
  const key = pathname || '/'
  if (sentPageViews.has(key)) return
  sentPageViews.add(key)
  const fbq = getFbq()
  if (!fbq) return
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
