'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getStoredUser } from '@/lib/api'
import { getCart, getCartTotal, clearCart, isWalletOnlyCart, CartItem } from '@/lib/cart'
import Image from 'next/image'
import Link from 'next/link'


export default function CheckoutPage() {
  const router = useRouter()
 const [cart, setCart] = useState<CartItem[]>([])
  const [deliveryZone, setDeliveryZone] = useState<'inside' | 'outside'>('inside')
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])

  // Wallet rate only applies when EVERY item in the cart is a wallet
  const walletOnly = isWalletOnlyCart(cart)
  const rates = walletOnly ? { inside: 60, outside: 100 } : { inside: 80, outside: 130 }
  const deliveryCharge = deliveryZone === 'inside' ? rates.inside : rates.outside
  const finalTotal = getCartTotal() + deliveryCharge

  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  

  useEffect(() => {
    const items = getCart()
    if (items.length === 0) router.push('/cart')
    setCart(items)

    if (!getStoredUser()) router.push('/auth/login')

    api.products.list({ hot_deal: true, in_stock: true, limit: 6 }).then(setRelatedProducts).catch(() => setRelatedProducts([]))
  }, [])

  async function handlePlaceOrder() {
    setLoading(true)
    setError('')

    if (!getStoredUser()) { router.push('/auth/login'); return }
    try {
      await api.orders.create({ phone, address: address.trim(), delivery_zone: deliveryZone === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka', items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity, size: item.size, color: item.color })) })
      clearCart()
      router.push('/order-success')
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  return (
    <div className="pb-24 bg-[#FAF5EF] min-h-screen">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold text-[#AD3735]">Checkout</h1>
      </div>

      {/* Order Summary */}
      <div className="mx-4 mt-3 bg-white rounded-xl p-4 shadow-sm space-y-4">
  <div>
    <h2 className="font-semibold text-gray-700 mb-3">Order Summary</h2>
    {cart.map(item => (
      <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
        <div className="flex flex-col">
          <span className="text-sm text-gray-700">{item.name} × {item.quantity}</span>
          {(item.size || item.color) && (
            <span className="text-xs text-gray-400 mt-0.5">
              {item.size && `Size: ${item.size}`}
              {item.size && item.color && ' • '}
              {item.color && `Color: ${item.color}`}
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-[#AD3735]">৳{item.price * item.quantity}</span>
      </div>
    ))}
  </div>

  {/* Price Breakdown Breakdown */}
  <div className="space-y-2 border-t pt-3 text-sm text-gray-600">
    <div className="flex justify-between items-center">
      <span>Subtotal</span>
      <span className="font-medium text-gray-800">৳{getCartTotal()}</span>
    </div>
    <div className="flex justify-between items-center">
      <span>Delivery Charge ({deliveryZone === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
      <span className="font-medium text-gray-800">৳{deliveryCharge}</span>
    </div>
  </div>

  {/* Final Total Amount */}
  <div className="flex justify-between items-center border-t pt-3">
    <span className="font-bold text-gray-800">Total Amount</span>
    <span className="font-bold text-[#AD3735] text-lg">৳{finalTotal}</span>
  </div>
</div>

      {/* Delivery Info */}
      <div className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-3">Delivery Info</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#C4874A] text-sm"
        />
        <textarea
          placeholder="Delivery address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C4874A] text-sm"
        />
      </div>

      <div className="bg-background border border-border p-4 rounded-xl space-y-3">
  <h3 className="font-semibold text-sm text-foreground">
    Delivery Area <span className="text-muted-foreground font-normal">(ডেলিভারি এলাকা)</span>
  </h3>
  
  <div className="grid grid-cols-2 gap-3">
    {/* Inside Dhaka */}
    <label className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
      deliveryZone === 'inside' 
        ? 'border-primary bg-primary/5' 
        : 'border-border hover:border-primary/40'
    }`}>
      <div className="flex items-center gap-2">
        <input 
          type="radio" 
          name="deliveryZone" 
          checked={deliveryZone === 'inside'}
          onChange={() => setDeliveryZone('inside')}
          className="text-primary focus:ring-primary h-4 w-4"
        />
        <div className="text-sm">
          <p className="font-medium text-foreground">Inside Dhaka</p>
        </div>
      </div>
      <span className="text-sm font-semibold text-primary">৳{rates.inside}</span>
    </label>

    {/* Outside Dhaka */}
    <label className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
      deliveryZone === 'outside' 
        ? 'border-primary bg-primary/5' 
        : 'border-border hover:border-primary/40'
    }`}>
      <div className="flex items-center gap-2">
        <input 
          type="radio" 
          name="deliveryZone" 
          checked={deliveryZone === 'outside'}
          onChange={() => setDeliveryZone('outside')}
          className="text-primary focus:ring-primary h-4 w-4"
        />
        <div className="text-sm">
          <p className="font-medium text-foreground">Outside Dhaka</p>
        </div>
      </div>
      <span className="text-sm font-semibold text-primary">৳{rates.outside}</span>
    </label>
  </div>
</div>

      <div className="mx-4 mt-4">
        <button
          onClick={handlePlaceOrder}
          disabled={loading || !address.trim() || !phone.trim()}
          className="w-full bg-[#AD3735] text-white py-4 rounded-xl font-semibold text-base hover:bg-[#C4874A] transition-colors disabled:opacity-50">
          {loading ? 'Placing Order...' : 'Place Order'}
          (৳{finalTotal})
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mx-4 mt-12">
        <div className="flex flex-col items-center gap-2">
          <Image src="/icons/24-hours.png" alt="24 Hours Delivery" width={40} height={40} className="text-[#AD3735]" />
          <p className="text-[10px] text-gray-700 leading-tight">
            24-48 Hours Super<br />Fast Delivery
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Image src="/icons/delivery-man.png" alt="24 Hours Delivery" width={40} height={40} className="text-[#AD3735]" />
          <p className="text-[10px] text-gray-700 leading-tight">
            Check and Trial and<br />Cash on Delivery
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Image src="/icons/fast-delivery.png" alt="24 Hours Delivery" width={40} height={40} className="text-[#AD3735]" />
          <p className="text-[10px] text-gray-700 leading-tight">
            No Extra Charge for<br />Size Exchange
          </p>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mx-4 mt-10">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">You May Also Like</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/shop/${p.id}`}
                className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {p.image_url ? (
                    <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">👟</div>
                  )}
                  {p.original_price && p.original_price > p.price && (
                    <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-semibold px-2 py-1 rounded">
                      -{Math.round(((p.original_price - p.price) / p.original_price) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-primary">৳{p.price}</span>
                    {p.original_price && p.original_price > p.price && (
                      <span className="text-sm text-muted-foreground line-through">৳{p.original_price}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
