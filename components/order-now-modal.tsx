'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  product: any
  selectedSize: string | null
  selectedColor: string | null
  onClose: () => void
}

type LineItem = {
  product: any
  size: string | null
  color: string | null
  quantity: number
}

export function OrderNowModal({ product, selectedSize, selectedColor, onClose }: Props) {
  const router = useRouter()

  // Wallets get a discounted delivery rate, everything else uses the standard rate
  const categoryName = product?.categories?.name?.toLowerCase() || ''
  const isWallet = categoryName.includes('wallet')
  const rates = isWallet
    ? { inside: 60, outside: 100 }
    : { inside: 80, outside: 130 }

  const [deliveryZone, setDeliveryZone] = useState<'inside' | 'outside'>('inside')
  const deliveryCharge = deliveryZone === 'inside' ? rates.inside : rates.outside

  // Colors as specified during product upload
  const colors = product.colors
    ? product.colors.split(',').map((c: string) => c.trim()).filter(Boolean)
    : []
  const [colorChoice, setColorChoice] = useState<string | null>(selectedColor ?? null)

  // Sizes as specified during product upload
  const sizes = product.sizes
    ? product.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
    : []
  const [sizeChoice, setSizeChoice] = useState<string | null>(selectedSize ?? null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  // Multi-item order state — the main product is always items[0]
  const [items, setItems] = useState<LineItem[]>([
    { product, size: selectedSize, color: selectedColor, quantity: 1 },
  ])
  const mainQuantity = items[0].quantity

  function setMainQuantity(updater: (q: number) => number) {
    setItems((prev) => {
      const next = [...prev]
      next[0] = { ...next[0], quantity: Math.max(1, updater(next[0].quantity)) }
      return next
    })
  }

  // Keep items[0]'s size/color in sync with the selectors below
  useEffect(() => {
    setItems((prev) => {
      const next = [...prev]
      next[0] = { ...next[0], size: sizeChoice, color: colorChoice }
      return next
    })
  }, [sizeChoice, colorChoice])

  // Related products from the same category, fetched once
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [relatedSizes, setRelatedSizes] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!product?.categories?.id) return
    supabase
      .from('products')
      .select('*')
      .eq('category_id', product.categories.id)
      .neq('id', product.id)
      .limit(3)
      .then(({ data }: any) => setRelatedProducts(data ?? []))
  }, [product?.id, product?.categories?.id])

  function addRelatedToOrder(p: any, size: string | null) {
    setItems((prev) => {
      const exists = prev.find((i) => i.product.id === p.id && i.size === size)
      if (exists) {
        return prev.map((i) =>
          i.product.id === p.id && i.size === size ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product: p, size, color: null, quantity: 1 }]
    })
  }

  function removeItem(index: number) {
    if (index === 0) return // main product can't be removed, only closed
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Calculations across all line items
  const itemTotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const finalTotal = itemTotal + deliveryCharge

  const nameValid = name.trim().length > 0
  const phoneValid = phone.trim().length > 0
  const addressValid = address.trim().length > 0
  const colorValid = colors.length === 0 || !!colorChoice
  const sizeValid = sizes.length === 0 || !!sizeChoice
  const formValid = nameValid && phoneValid && addressValid && colorValid && sizeValid

  async function handleOrder() {
    setTouched(true)

    if (!formValid) {
      setError('Please fill in all fields before placing your order.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const noteparts = []
    if (sizeChoice) noteparts.push(`Size: ${sizeChoice}`)
    if (colorChoice) noteparts.push(`Color: ${colorChoice}`)
    const addressWithNote = noteparts.length
      ? `${address.trim()}\n[${noteparts.join(', ')}]`
      : address.trim()

    let orderId: number

    if (user) {
      // Logged-in path — unchanged, RLS already allows this
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: finalTotal,
          delivery_zone: deliveryZone === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
          delivery_charge: deliveryCharge,
          address: addressWithNote,
          phone: phone.trim(),
          status: 'pending',
          is_guest: false,
          guest_name: null,
        })
        .select()
        .single()

      if (orderErr) {
        setError(orderErr.message)
        setLoading(false)
        return
      }
      orderId = order.id
    } else {
      // Guest path — goes through the RPC function instead
      const { data: newOrderId, error: rpcErr } = await supabase.rpc('create_guest_order', {
        p_total: finalTotal,
        p_zone: deliveryZone === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
        p_charge: deliveryCharge,
        p_address: addressWithNote,
        p_phone: phone.trim(),
        p_guest_name: name.trim(),
      })

      if (rpcErr) {
        setError(rpcErr.message)
        setLoading(false)
        return
      }
      orderId = newOrderId
    }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      items.map((i) => ({
        order_id: orderId,
        product_id: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
      }))
    )

    if (itemsErr) {
      setError(itemsErr.message)
      setLoading(false)
      return
    }

    router.push('/order-success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col transform transition-all border border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-800">Quick Checkout</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Interactive Counter Area — controls the main product's quantity */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</span>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setMainQuantity((q) => q - 1)}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-50 text-gray-600 active:scale-95 transition-transform"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-bold text-sm text-gray-800">{mainQuantity}</span>
              <button
                type="button"
                onClick={() => setMainQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-50 text-gray-600 active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Item Unit Price</span>
            <span className="text-gray-500 font-medium text-xs">৳{product.price} each</span>
          </div>
        </div>

        {/* Integrated Order Summary Block — lists every line item */}
        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-sm space-y-3.5 mb-4">
          <div className="space-y-2.5">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Order Summary (সারসংক্ষেপ)</h3>
            {items.map((item, idx) => (
              <div key={`${item.product.id}-${item.size ?? 'nosize'}-${idx}`} className="flex justify-between items-start py-1">
                <div className="flex gap-3 items-center">
                  {item.product.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 line-clamp-1">{item.product.name}</span>
                    {(item.size || item.color) && (
                      <div className="flex gap-1.5 text-xs text-gray-500 mt-0.5 font-medium">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.size && item.color && <span>•</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                    ৳{item.product.price} × {item.quantity}
                  </span>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Details Breakdown */}
          <div className="space-y-2 border-t border-gray-100 pt-3 text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-800">৳{itemTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex flex-col">
                <span>Delivery Charge</span>
                <span className="text-[11px] text-gray-400 font-normal">
                  ({deliveryZone === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'})
                </span>
              </span>
              <span className="font-semibold text-gray-800">৳{deliveryCharge}</span>
            </div>
          </div>

          {/* Grand Absolute Total */}
          <div className="flex justify-between items-center border-t border-gray-100 pt-3">
            <span className="font-bold text-gray-800 text-sm">Total Amount</span>
            <span className="font-black text-primary text-xl">৳{finalTotal}</span>
          </div>
        </div>

        {/* Size Selector — required if the main product has sizes */}
        {sizes.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">
              Select Size <span className="normal-case text-gray-400 font-normal">(সাইজ নির্বাচন করুন) *</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size: string) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSizeChoice(size)}
                  className={`min-w-[40px] px-3.5 py-1.5 rounded-lg border-2 text-xs font-semibold transition-colors ${
                    sizeChoice === size
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-700 hover:border-primary/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {touched && !sizeValid && <p className="text-red-500 text-xs mt-1.5 ml-1">Please select a size</p>}
          </div>
        )}

        {/* Color Selector — required if the main product has colors */}
        {colors.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">
              Select Color <span className="normal-case text-gray-400 font-normal">(রঙ নির্বাচন করুন) *</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color: string) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorChoice(color)}
                  className={`px-3.5 py-1.5 rounded-lg border-2 text-xs font-semibold transition-colors ${
                    colorChoice === color
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-700 hover:border-primary/50'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
            {touched && !colorValid && <p className="text-red-500 text-xs mt-1.5 ml-1">Please select a color</p>}
          </div>
        )}

        {/* Delivery Form inputs */}
        <div className="space-y-3 mb-4">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Shipping Details</h3>
          <div>
            <input
              type="text"
              placeholder="Your name (আপনার নাম) *"
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50/30 ${
                touched && !nameValid ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {touched && !nameValid && <p className="text-red-500 text-xs mt-1 ml-1">Name is required</p>}
          </div>
          <div>
            <input
              type="tel"
              placeholder="Phone number (মোবাইল নম্বর) *"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50/30 ${
                touched && !phoneValid ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {touched && !phoneValid && <p className="text-red-500 text-xs mt-1 ml-1">Phone number is required</p>}
          </div>
          <div>
            <textarea
              placeholder="Full delivery address (পূর্ণ ঠিকানা) *"
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={2}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50/30 resize-none ${
                touched && !addressValid ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {touched && !addressValid && <p className="text-red-500 text-xs mt-1 ml-1">Delivery address is required</p>}
          </div>
        </div>

        {/* Delivery Zone Options */}
        <div className="bg-gray-50/50 border border-gray-200 p-3 rounded-xl space-y-2 mb-5">
          <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider">
            Delivery Area <span className="text-gray-400 font-normal normal-case">(ডেলিভারি এলাকা)</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Inside Dhaka */}
            <label className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
              deliveryZone === 'inside'
                ? 'border-primary bg-[#FAF5EF]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryZoneModal"
                  checked={deliveryZone === 'inside'}
                  onChange={() => setDeliveryZone('inside')}
                  className="text-primary focus:ring-primary h-4 w-4 border-gray-300"
                />
                <span className="text-xs font-bold text-gray-700">Inside Dhaka</span>
              </div>
              <span className="text-xs font-black text-primary">৳{rates.inside}</span>
            </label>

            {/* Outside Dhaka */}
            <label className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
              deliveryZone === 'outside'
                ? 'border-primary bg-[#FAF5EF]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryZoneModal"
                  checked={deliveryZone === 'outside'}
                  onChange={() => setDeliveryZone('outside')}
                  className="text-primary focus:ring-primary h-4 w-4 border-gray-300"
                />
                <span className="text-xs font-bold text-gray-700">Outside Dhaka</span>
              </div>
              <span className="text-xs font-black text-primary">৳{rates.outside}</span>
            </label>
          </div>
        </div>

        {/* Related Products — "Special Offer Just For You!" */}
        {relatedProducts.length > 0 && (
          <section className="mb-5">
            <h2 className="font-serif text-lg font-bold text-gray-800 mb-3">Special Offer Just For You!</h2>
            <div className="space-y-3">
              {relatedProducts.map((p) => {
                const pSizes = p.sizes
                  ? p.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
                  : []
                const currentSize = relatedSizes[p.id] ?? pSizes[0] ?? null
                return (
                  <div key={p.id} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3">
                    <Link href={`/shop/${p.id}`} className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-50">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">👟</div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${p.id}`} className="font-medium text-sm text-gray-800 line-clamp-1 hover:underline">
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.original_price && p.original_price > p.price && (
                          <span className="text-xs text-gray-400 line-through">৳{p.original_price}</span>
                        )}
                        <span className="text-sm font-bold text-primary">৳{p.price}</span>
                      </div>
                      {pSizes.length > 0 && (
                        <select
                          value={currentSize ?? ''}
                          onChange={(e) => setRelatedSizes((s) => ({ ...s, [p.id]: e.target.value }))}
                          className="mt-1 text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          {pSizes.map((sz: string) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => addRelatedToOrder(p, currentSize)}
                      className="shrink-0 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-full hover:opacity-90"
                    >
                      + Add
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <div className="grid grid-cols-3 gap-4 text-center mx-4 mb-4">
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

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleOrder}
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-[#7d431e] active:scale-[0.99] transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none text-sm uppercase tracking-wider"
        >
          {loading ? 'Placing Order...' : `Confirm Order · ৳${finalTotal}`}
        </button>
      </div>
    </div>
  )
}
