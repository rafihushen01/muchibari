'use client'

import { addToCart } from '@/lib/cart'
import { useRouter } from 'next/navigation'
import { FaCartShopping } from "react-icons/fa6";
import { trackAddToCart } from '@/lib/analytics/meta'

export function AddToCartButton({ product }: { product: any }) {
  function handleAddToCart() {
    try {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url ?? '',
        category: product.categories?.name ?? '',
        sizeOptions: product.sizes ?? undefined,
        colorOptions: product.colors ?? undefined,
      })
      trackAddToCart({ id: product.id, name: product.name, price: product.price, quantity: 1 })
      alert('Added to cart! Choose size/color from your cart before checkout.')
    } catch {
      alert('Unable to add this product to your cart. Please try again.')
    }
  }

  return (
    <button
  onClick={handleAddToCart}
  className="flex items-center justify-center gap-3 w-full bg-[#AD3735] text-white py-4 rounded-xl font-semibold text-base hover:bg-[#C4874A] transition-colors">
  <FaCartShopping size={20} />
  Add to Cart
</button>
  )
}