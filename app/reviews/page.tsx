import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'
import { getWhatsAppLink } from '@/lib/data'
import { ReviewCard } from '@/components/review-card'
import { api } from '@/lib/api'

export default async function ReviewsPage() {
  const rawReviews = await api.reviews.list({ approved: true })

  const reviews = (rawReviews ?? []).map((r: any) => ({
    id: r.id,
    name: r.profiles?.full_name ?? 'Anonymous',
    rating: r.rating,
    comment: r.comment,
    date: r.created_at,
  }))

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
      : 0,
  }))

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-primary-foreground">
            Customer Reviews
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            আমাদের সম্মানিত ক্রেতাদের মতামত
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Rating Summary */}
        <div className="bg-card rounded-xl p-6 lg:p-8 shadow-sm mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-5xl font-bold text-foreground">{averageRating}</span>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-6 h-6 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Based on {reviews.length} reviews
                  </p>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">
                আমাদের ক্রেতাদের সন্তুষ্টি আমাদের সাফল্যের মাপকাঠি। প্রতিটি রিভিউ আমাদের
                আরও ভালো হতে অনুপ্রাণিত করে।
              </p>
            </div>
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        {reviews.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No approved reviews yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-muted rounded-2xl p-8 lg:p-12 text-center">
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">
            Satisfied Customer? We{"'"}d Love to Hear From You!
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            আপনার অভিজ্ঞতা শেয়ার করুন এবং অন্যদের সঠিক সিদ্ধান্ত নিতে সাহায্য করুন।
            WhatsApp-এ আমাদের রিভিউ পাঠান!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            
            <a  href={getWhatsAppLink('Hi, I want to share my review for Muchi Bari!')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#25D366]/90 transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share Your Review
            </a>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
