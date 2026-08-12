// Transitional adapter: preserves existing component call sites while every request now goes to Express/MongoDB.
// New code should import `api` from `@/lib/api` directly.
import { api, getStoredUser } from './api'

let pendingOrder: any = null

type LegacyResult = { data: any; error: any }
class Query implements PromiseLike<LegacyResult> {
  private filters: Array<[string, any, 'eq' | 'neq' | 'ilike']> = []
  private take?: number
  private mutation?: { type: 'insert' | 'update' | 'delete'; value?: any }
  constructor(private table: string) {}
  select() { return this }
  eq(key: string, value: any) { this.filters.push([key, value, 'eq']); return this }
  neq(key: string, value: any) { this.filters.push([key, value, 'neq']); return this }
  ilike(key: string, value: string) { this.filters.push([key, value, 'ilike']); return this }
  order() { return this }
  limit(value: number) { this.take = value; return this }
  single() { return this.execute(true) }
  maybeSingle() { return this.execute(true) }
  insert(value: any) { this.mutation = { type: 'insert', value }; return this }
  update(value: any) { this.mutation = { type: 'update', value }; return this }
  delete() { this.mutation = { type: 'delete' }; return this }
  then<TResult1 = LegacyResult, TResult2 = never>(resolve?: ((value: LegacyResult) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.execute().then(resolve, reject) }
  private async execute(one = false) {
    try {
      const id = this.filters.find(([key, , op]) => key === 'id' && op === 'eq')?.[1]
      const getFilter = (key: string) => this.filters.find(([filter]) => filter === key)?.[1]
      let data: any
      if (this.table === 'products') {
        if (this.mutation?.type === 'insert') data = await api.products.create(this.mutation.value)
        else if (this.mutation?.type === 'update') data = await api.products.update(String(id), this.mutation.value)
        else if (this.mutation?.type === 'delete') { await api.products.remove(String(id)); data = null }
        else if (id) data = await api.products.get(String(id))
        else data = await api.products.list({ in_stock: getFilter('in_stock'), category: getFilter('categories.slug'), q: String(getFilter('name') || '').replaceAll('%', ''), limit: this.take })
      } else if (this.table === 'categories') {
        if (this.mutation?.type === 'insert') data = await api.categories.create(this.mutation.value)
        else if (this.mutation?.type === 'update') data = await api.categories.update(String(id), this.mutation.value)
        else if (this.mutation?.type === 'delete') { await api.categories.remove(String(id)); data = null }
        else data = await api.categories.list()
      } else if (this.table === 'reviews') {
        if (this.mutation?.type === 'insert') data = await api.reviews.create(this.mutation.value)
        else if (this.mutation?.type === 'update') data = await api.reviews.approval(String(id), Boolean(this.mutation.value.approved))
        else if (this.mutation?.type === 'delete') { await api.reviews.remove(String(id)); data = null }
        else data = await api.reviews.list({ product_id: getFilter('product_id'), approved: getFilter('approved') })
      } else if (this.table === 'hero_banner') {
        if (this.mutation) data = await api.banner.update(this.mutation.value); else data = await api.banner.get()
      } else if (this.table === 'profiles') {
        if (this.mutation?.type === 'update') data = await api.users.updateMe(this.mutation.value); else data = getStoredUser()
      } else if (this.table === 'orders') {
        if (this.mutation?.type === 'insert') { pendingOrder = this.mutation.value; data = { id: 'pending-order' } }
        else data = await api.orders.list()
      } else if (this.table === 'order_items') {
        if (this.mutation?.type !== 'insert' || !pendingOrder) throw new Error('Order items require a pending order.')
        const created = await api.orders.create({ guest_name: pendingOrder.guest_name, phone: pendingOrder.phone, address: pendingOrder.address, delivery_zone: pendingOrder.delivery_zone, items: this.mutation.value.map((item: any) => ({ product_id: item.product_id, quantity: item.quantity, size: item.size, color: item.color })) })
        pendingOrder = null; data = created.order
      } else throw new Error(`Unsupported legacy table: ${this.table}`)
      if (Array.isArray(data) && one) data = data[0] ?? null
      return { data, error: null }
    } catch (error: any) { return { data: null, error: { message: error.message } }
    }
  }
}

export const supabase: any = {
  from: (table: string) => new Query(table),
  auth: {
    async getUser() { const user = getStoredUser(); return { data: { user }, error: null } },
    async getSession() { const user = getStoredUser(); return { data: { session: user ? { user } : null } } },
    async signInWithPassword({ email, password }: any) { try { const result = await api.auth.login(email, password); return { data: { user: result.user }, error: null } } catch (error: any) { return { data: null, error: { message: error.message } } } },
    async signUp({ email, password, options }: any) { try { await api.auth.register(options?.data?.full_name || '', email, password); return { data: { user: getStoredUser() }, error: null } } catch (error: any) { return { data: null, error: { message: error.message } } } },
    async signOut() { api.auth.logout(); return { error: null } },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
    async updateUser() { return { error: { message: 'Use the MongoDB credentials endpoint.' } } },
  },
  storage: { from(folder: 'products' | 'categories' | 'banners') { return { async upload(_path: string, file: File) { try { const [image] = await api.uploadImages([file], folder); return { data: { path: image.url }, error: null } } catch (error: any) { return { data: null, error: { message: error.message } } } }, getPublicUrl(path: string) { return { data: { publicUrl: path } } } } } },
  async rpc(name: string, params: any) { if (name !== 'create_guest_order') return { data: null, error: { message: 'Unsupported operation.' } }; pendingOrder = { guest_name: params.p_guest_name, phone: params.p_phone, address: params.p_address, delivery_zone: params.p_zone }; return { data: 'pending-order', error: null } },
}
