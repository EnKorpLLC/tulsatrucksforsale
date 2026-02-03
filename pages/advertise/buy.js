import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PLACEMENTS = [
  { value: 'homepage', label: 'Homepage', description: 'Your ad appears on the main landing page' },
  { value: 'listings', label: 'Listings Page', description: 'Your ad shows on the browse trucks page sidebar' },
  { value: 'truck_detail', label: 'Truck Detail Pages', description: 'Your ad appears on individual truck listings' },
];

export default function BuyAd() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    image_url: '',
    link_url: '',
    placement: 'homepage',
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login?redirect=/advertise/buy');
          return;
        }
        setUser(data.user);
        setLoading(false);
      });
  }, [router]);

  async function handleCheckout(e) {
    e.preventDefault();
    if (!form.title || !form.image_url) {
      alert('Title and Image URL are required');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/create-ad-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error === 'EMAIL_VERIFICATION_REQUIRED') router.push('/verify-email?required=1');
      else alert(data.error || data.message || 'Something went wrong. Please try again.');
    } catch (err) {
      alert('Failed to start checkout.');
    }
    setCheckoutLoading(false);
  }

  if (loading || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/advertise" className="text-primary-600 hover:underline mb-6 inline-block">← Back to Advertise</Link>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Buy an Ad</h1>
      <p className="text-slate-600 mb-8">Your ad will be reviewed before going live. $99 for 30 days.</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <p className="text-2xl font-bold text-primary-700">$99 for 30 days</p>
          <p className="text-slate-600 text-sm mt-1">One-time payment. Ad runs 30 days after approval.</p>
        </div>

        <form onSubmit={handleCheckout} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Premium Truck Parts"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL *</label>
            <input
              type="url"
              required
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://example.com/ad-image.jpg"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-slate-500 text-xs mt-1">Recommended size: 1200x675px (16:9 ratio)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link URL (where ad clicks go)</label>
            <input
              type="url"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://yourwebsite.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ad Placement</label>
            <div className="space-y-3">
              {PLACEMENTS.map((p) => (
                <label key={p.value} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="placement"
                    value={p.value}
                    checked={form.placement === p.value}
                    onChange={(e) => setForm({ ...form, placement: e.target.value })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-slate-900">{p.label}</p>
                    <p className="text-slate-600 text-sm">{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={checkoutLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50"
          >
            {checkoutLoading ? 'Loading...' : 'Pay $99 with Stripe'}
          </button>
        </form>
      </div>
    </div>
  );
}
