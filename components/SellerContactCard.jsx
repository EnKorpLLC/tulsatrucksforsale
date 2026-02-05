import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isProSeller } from '../lib/sellerPlan';

export default function SellerContactCard({ seller, sellerPlan, truckName }) {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!seller?.id) return;
    fetch(`/api/seller/reviews?sellerId=${seller.id}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
      })
      .finally(() => setReviewsLoading(false));
  }, [seller?.id]);

  if (!seller) return null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const subject = truckName ? `Inquiry: ${truckName}` : 'Truck inquiry';
  const phoneForLink = seller.phone ? `tel:${seller.phone.replace(/\D/g, '')}` : '';
  const smsForLink = seller.phone ? `sms:${seller.phone.replace(/\D/g, '')}` : '';

  return (
    <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
          {seller.profile_picture_url ? (
            <img src={seller.profile_picture_url} alt={seller.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xl font-bold">
              {seller.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900">{seller.name}</h3>
            {isProSeller(sellerPlan) && (
              <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded">Pro Seller</span>
            )}
          </div>
          {seller.company && <p className="text-slate-600 text-sm">{seller.company}</p>}

          {/* Only show contact buttons if at least one method is visible */}
          {((!seller.hide_phone && seller.phone) || (!seller.hide_email && seller.email)) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {seller.phone && !seller.hide_phone && (
                <>
                  <a
                    href={phoneForLink}
                    className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Call
                  </a>
                  <a
                    href={smsForLink}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Text
                  </a>
                </>
              )}
              {seller.email && !seller.hide_email && (
                <a
                  href={`mailto:${seller.email}?subject=${encodeURIComponent(subject)}`}
                  className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium py-2 px-3 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Email
                </a>
              )}
            </div>
          )}
          <p className="text-slate-500 text-sm mt-3">
            {(!seller.hide_phone && seller.phone) || (!seller.hide_email && seller.email)
              ? 'Contact the seller directly to make an offer—no account required.'
              : 'Use the Message button to contact this seller.'}
          </p>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <h4 className="font-medium text-slate-900 mb-2">Seller Reviews</h4>
        {reviewsLoading ? (
          <p className="text-slate-500 text-sm">Loading reviews...</p>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-900">{avgRating}</span>
              <span className="text-amber-500">★</span>
              <span className="text-slate-500">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="bg-white rounded-lg p-3 text-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span className="text-slate-500 text-xs">{r.reviewer_name || 'Buyer'}</span>
                  </div>
                  {r.comment && <p className="text-slate-600">{r.comment}</p>}
                </div>
              ))}
            </div>
            <Link
              href={`/seller/${seller.id}/reviews`}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all reviews →
            </Link>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
