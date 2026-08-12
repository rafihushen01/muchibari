'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Star, Truck, Shield, RotateCcw } from 'lucide-react'
import { products, reviews, getWhatsAppLink } from '@/lib/data'
import { ProductCard } from '@/components/product-card'
import { ReviewCard } from '@/components/review-card'

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  
  const product = products.find((p) => p.id === productId)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/shop" className="text-primary hover:underline">
            Return to Shop
          </Link>
        </div>
      </div>
    )
  }

  const productReviews = reviews.filter((r) => r.productId === productId)
  const relatedProducts = products.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 3)

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const whatsappMessage = `Hi, I want to order:\n\nProduct: ${product.name}\nPrice: ৳${product.price}${selectedSize ? `\nSize: ${selectedSize}` : ''}\n\nPlease confirm availability.`

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-muted py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back Button - Mobile */}
        <Link
          href="/shop"
          className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-sm font-semibold px-3 py-1.5 rounded-lg">
                -{discount}% OFF
              </span>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">
              {product.name}
            </h1>
            {product.nameBn && (
              <p className="text-muted-foreground mt-1">{product.nameBn}</p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-5 h-5 fill-secondary text-secondary"
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                (4.8) · {productReviews.length} reviews
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mt-6">
              <span className="text-3xl font-bold text-primary">৳{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ৳{product.originalPrice}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-foreground/80 leading-relaxed mt-6">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mt-8">
              <h3 className="font-semibold mb-3">
                Select Size <span className="text-muted-foreground font-normal">সাইজ নির্বাচন করুন</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                      selectedSize === size
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp Order Button */}
            <a
              href={getWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full bg-[#25D366] text-white py-4 rounded-lg font-semibold hover:bg-[#25D366]/90 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Order via WhatsApp
            </a>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs mt-2 text-muted-foreground">সারাদেশে ডেলিভারি</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs mt-2 text-muted-foreground">১০০% আসল লেদার</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <RotateCcw className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs mt-2 text-muted-foreground">সহজ রিটার্ন</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        {productReviews.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
              Customer Reviews
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
              You May Also Like
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
