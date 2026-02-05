import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function BoostListing() {
  const router = useRouter();
  const { truckId } = router.query;
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!truckId) return;
    supabase.from('truck_trucks').select('*').eq('id', truckId).single().then(({ data }) => {
      setTruck(data);
      setLoading(false);
    });
  }, [truckId]);

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truckId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else alert('Something went wrong. Please try again.');
    } catch (err) {
      alert('Failed to start checkout.');
    }
    setCheckoutLoading(false);
  }

  if (loading || !truck) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const photos = truck.photos && Array.isArray(truck.photos) ? truck.photos : [];
  const mainPhoto = photos[0] || 'https://via.placeholder.com/400x300?text=Truck';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href={`/trucks/${truckId}`} className="text-primary-600 hover:underline mb-6 inline-block">← Back to listing</Link>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div>
            <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden mb-4">
              <img src={mainPhoto} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Truck'; }} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {truck.year} {truck.make} {truck.model}
            </h1>
            <p className="text-slate-600">${Number(truck.price).toLocaleString()}</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Get your truck seen first</h2>
            <p className="text-slate-600 mb-6">
              Featured listings appear at the top of the homepage and browse page. More visibility means more buyers.
            </p>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <p className="text-2xl font-bold text-primary-700">$29 for 7 days</p>
              <p className="text-slate-600 text-sm mt-1">One-time payment. Your listing stays featured for 7 days.</p>
            </div>
            <ul className="space-y-2 text-slate-700 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Appear at top of homepage
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Appear at top of browse listings
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Featured badge on your listing
              </li>
            </ul>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50"
            >
              {checkoutLoading ? 'Loading...' : 'Pay $29 with Stripe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
