import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function SellerReviewsPage() {
  const router = useRouter();
  const { sellerId } = router.query;
  const [seller, setSeller] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  useEffect(() => {
    if (!sellerId) return;
    supabase.from('truck_sellers').select('id, name, company, profile_picture_url').eq('id', sellerId).single()
      .then(({ data }) => setSeller(data));
    fetch(`/api/seller/reviews?sellerId=${sellerId}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .finally(() => setLoading(false));
  }, [sellerId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/seller/${sellerId}/reviews`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          seller_id: sellerId,
          rating: form.rating,
          comment: form.comment,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setReviews([data.review, ...reviews]);
        setForm({ rating: 5, comment: '' });
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !seller) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/listings" className="text-primary-600 hover:underline mb-6 inline-block">← Back to Listings</Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200">
          {seller.profile_picture_url ? (
            <img src={seller.profile_picture_url} alt={seller.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xl font-bold">
              {seller.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{seller.name}</h1>
          {seller.company && <p className="text-slate-600">{seller.company}</p>}
          {avgRating && (
            <p className="text-slate-600 text-sm mt-1">
              <span className="text-amber-500 font-semibold">{avgRating} ★</span> ({reviews.length} reviews)
            </p>
          )}
        </div>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="font-semibold text-slate-900 mb-4">Leave a Review</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, rating: n })}
                    className={`text-2xl ${form.rating >= n ? 'text-amber-500' : 'text-slate-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comment (optional)</label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Share your experience..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div className="bg-slate-50 rounded-xl p-4 mb-8">
          <Link href={`/login?redirect=/seller/${sellerId}/reviews`} className="text-primary-600 hover:underline font-medium">
            Log in to leave a review
          </Link>
        </div>
      )}

      <h2 className="font-semibold text-slate-900 mb-4">All Reviews</h2>
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-slate-500 text-sm">{r.reviewer_name || 'Buyer'}</span>
                <span className="text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-slate-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No reviews yet.</p>
      )}
    </div>
  );
}
