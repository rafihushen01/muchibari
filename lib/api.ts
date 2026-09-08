const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const TOKEN_KEY = 'muchi_bari_token'
const USER_KEY = 'muchi_bari_user'

function metaHeaders() {
  if (typeof document === 'undefined') return {}
  const cookies = document.cookie.split(';').map((value) => value.trim())
  const get = (name: string) => cookies.find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1)
  const headers: Record<string, string> = {}
  const fbp = get('_fbp'); const fbc = get('_fbc')
  if (fbp) headers['X-Meta-Fbp'] = fbp
  if (fbc) headers['X-Meta-Fbc'] = fbc
  return headers
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export class ApiError extends Error { constructor(message: string, public status: number) { super(message) } }

export function getToken() { return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY) }
export function getStoredUser<T = any>(): T | null { if (typeof window === 'undefined') return null; const value = localStorage.getItem(USER_KEY); return value ? JSON.parse(value) : null }
export function clearSession() { if (typeof window !== 'undefined') { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); window.dispatchEvent(new Event('muchi-bari-auth-change')) } }
function saveSession(session: { token: string; user: any }) { localStorage.setItem(TOKEN_KEY, session.token); localStorage.setItem(USER_KEY, JSON.stringify(session.user)); window.dispatchEvent(new Event('muchi-bari-auth-change')) }

export async function apiFetch<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...init } = options
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(body instanceof FormData ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...metaHeaders(), ...headers },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  })
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(data.message || 'Request failed.', response.status)
  return data as T
}

export const api = {
  auth: {
    async login(email: string, password: string) { const session = await apiFetch<{ token: string; user: any }>('/auth/login', { method: 'POST', body: { email, password } }); saveSession(session); return session },
    async register(full_name: string, email: string, password: string) { const session = await apiFetch<{ token: string; user: any }>('/auth/register', { method: 'POST', body: { full_name, email, password } }); saveSession(session); return session },
    async me() { const result = await apiFetch<{ user: any }>('/auth/me'); if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(result.user)); return result.user },
    logout: clearSession,
    async credentials(currentPassword: string, changes: { email?: string; newPassword?: string }) { const session = await apiFetch<{ token: string; user: any }>('/auth/credentials', { method: 'PATCH', body: { currentPassword, ...changes } }); saveSession(session); return session },
  },
  products: {
    async list(params: Record<string, string | number | boolean | undefined> = {}) { const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return (await apiFetch<{ products: any[] }>(`/products${search.size ? `?${search}` : ''}`)).products },
    async get(id: string) { return (await apiFetch<{ product: any }>(`/products/${id}`)).product },
    async create(data: any) { return (await apiFetch<{ product: any }>('/products', { method: 'POST', body: data })).product },
    async update(id: string, data: any) { return (await apiFetch<{ product: any }>(`/products/${id}`, { method: 'PATCH', body: data })).product },
    remove(id: string) { return apiFetch<void>(`/products/${id}`, { method: 'DELETE' }) },
  },
  categories: {
    async list() { return (await apiFetch<{ categories: any[] }>('/categories')).categories },
    async create(data: any) { return (await apiFetch<{ category: any }>('/categories', { method: 'POST', body: data })).category },
    async update(id: string, data: any) { return (await apiFetch<{ category: any }>(`/categories/${id}`, { method: 'PATCH', body: data })).category },
    remove(id: string) { return apiFetch<void>(`/categories/${id}`, { method: 'DELETE' }) },
  },
  reviews: {
    async list(params: Record<string, string | boolean | undefined> = {}) { const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return (await apiFetch<{ reviews: any[] }>(`/reviews${search.size ? `?${search}` : ''}`)).reviews },
    create(data: any) { return apiFetch('/reviews', { method: 'POST', body: data }) },
    approval(id: string, approved: boolean) { return apiFetch(`/reviews/${id}/approval`, { method: 'PATCH', body: { approved } }) },
    remove(id: string) { return apiFetch<void>(`/reviews/${id}`, { method: 'DELETE' }) },
  },
  orders: {
    create(data: any) { return apiFetch<{ order: any }>('/orders', { method: 'POST', body: data }) },
    async mine() { return (await apiFetch<{ orders: any[] }>('/orders/mine')).orders },
    async list() { return (await apiFetch<{ orders: any[] }>('/orders')).orders },
    status(id: string, status: string) { return apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: { status } }) },
  },
  banner: { async get() { return (await apiFetch<{ banner: any }>('/banner')).banner }, update(data: any) { return apiFetch('/banner', { method: 'PUT', body: data }) } },
  users: { async updateMe(data: any) { return (await apiFetch<{ user: any }>('/users/me', { method: 'PATCH', body: data })).user } },
  async uploadImages(files: File[], folder: 'products' | 'categories' | 'banners') { const form = new FormData(); form.append('folder', folder); files.forEach((file) => form.append('images', file)); return (await apiFetch<{ images: { url: string }[] }>('/uploads', { method: 'POST', body: form })).images },
}
