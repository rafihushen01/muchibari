import { Star } from 'lucide-react'
import { Review } from '@/lib/data'

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= review.rating
                ? 'fill-secondary text-secondary'
                : 'fill-muted text-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-foreground/80 leading-relaxed mb-4">{review.comment}</p>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{review.name}</span>
        <span className="text-sm text-muted-foreground">
          {new Date(review.date).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  )
}
