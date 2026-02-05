import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { isProSeller, PLAN_PRICES, PLAN_LABELS, getListingLimit } from '../../lib/sellerPlan';

const PLANS = [
  { type: 'pro', price: PLAN_PRICES.pro, listings: 3, label: 'Pro' },
  { type: 'pro_plus', price: PLAN_PRICES.pro_plus, listings: 6, label: 'Pro+' },
  { type: 'dealer', price: PLAN_PRICES.dealer, listings: 25, label: 'Dealer' },
];

export default function UpgradeSeller() {
  const router = useRouter();
  const { sellerId } = router.query;
  const [seller, setSeller] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    if (!sellerId) return;
    Promise.all([
      supabase.from('truck_sellers').select('*').eq('id', sellerId).single(),
      supabase.from('truck_seller_plans').select('*').eq('seller_id', sellerId).single(),
    ]).then(([sellerRes, planRes]) => {
      setSeller(sellerRes.data);
      setPlan(planRes.data);
      setLoading(false);
    });
  }, [sellerId]);

  async function handleCheckout(planType) {
    setCheckoutLoading(planType);
    try {
      const res = await fetch('/api/stripe/create-seller-plan-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, planType }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else alert('Something went wrong. Please try again.');
    } catch (err) {
      alert('Failed to start checkout.');
    }
    setCheckoutLoading(null);
  }

  if (loading || !seller) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const currentTier = plan?.plan_type || 'free';
  const isPaid = isProSeller(plan);
  const expiresAt = plan?.plan_expires ? new Date(plan.plan_expires).toLocaleDateString() : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/dashboard" className="text-primary-600 hover:underline mb-6 inline-block">← Back to Dashboard</Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Upgrade Your Plan</h1>
        <p className="text-slate-600">Account: {seller.name} ({seller.email})</p>
        {isPaid && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-semibold text-green-800">Current plan: {PLAN_LABELS[currentTier] || currentTier}</p>
            {expiresAt && <p className="text-green-700 text-sm mt-1">Expires: {expiresAt}</p>}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const isCurrent = currentTier === p.type;
          const isHigher = ['pro', 'pro_plus', 'dealer'].indexOf(p.type) > ['pro', 'pro_plus', 'dealer'].indexOf(currentTier);
          return (
            <div
              key={p.type}
              className={`rounded-xl border-2 p-6 ${
                isCurrent ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'
              }`}
            >
              <h3 className="text-lg font-bold text-slate-900">{p.label}</h3>
              <p className="text-3xl font-bold text-primary-600 mt-2">${p.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
              <p className="text-slate-600 text-sm mt-1">Up to {p.listings} active listings</p>
              <ul className="mt-4 space-y-2 text-slate-700 text-sm">
                <li>✓ Listings appear above free sellers</li>
                <li>✓ 15 photos per truck</li>
                <li>✓ {p.label} Seller badge</li>
              </ul>
              {isCurrent ? (
                <p className="mt-6 text-green-600 font-medium">Current plan</p>
              ) : (
                <button
                  onClick={() => handleCheckout(p.type)}
                  disabled={!!checkoutLoading}
                  className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {checkoutLoading === p.type ? 'Loading...' : `Upgrade - $${p.price}/mo`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-slate-500 text-sm">
        Free plan: 1 active listing, 6 photos. Upgrade to list more trucks.
      </p>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
