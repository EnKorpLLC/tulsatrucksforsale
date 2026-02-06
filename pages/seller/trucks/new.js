import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPhotoLimit } from '../../../lib/sellerPlan';
import PhotoUpload from '../../../components/PhotoUpload';
import { TRUCK_MAKES, getModelsForMake, TRUCK_YEARS, TRUCK_CONDITIONS } from '../../../lib/truckOptions';

export default function NewTruck() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerPlan, setSellerPlan] = useState(null);
  const [listingCount, setListingCount] = useState({ count: 0, limit: 1 });
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    price: '',
    description: '',
    vin: '',
    status: 'available',
    condition: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login?redirect=/seller/trucks/new');
          return;
        }
        setUser(data.user);
      });
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // Fetch the user's seller profile
    fetch('/api/seller/profile')
      .then((r) => r.json())
      .then((data) => {
        if (!data.seller || !data.seller.phone) {
          // No complete seller profile - redirect to complete it
          router.replace('/seller/profile?required=1');
          return;
        }
        setSeller(data.seller);
        setForm((prev) => ({
          ...prev,
          city: (data.seller.city || prev.city || '').trim(),
          state: (data.seller.state || prev.state || '').trim(),
        }));
        fetchSellerPlan(data.seller.id);
        fetchListingCount();
        setLoading(false);
      });
  }, [user, router]);

  // Prepopulate city/state from seller when seller loads (only if form fields are still empty)
  useEffect(() => {
    if (seller && (seller.city || seller.state)) {
      setForm((prev) => ({
        ...prev,
        city: prev.city || seller.city || '',
        state: prev.state || seller.state || '',
      }));
    }
  }, [seller?.id, seller?.city, seller?.state]);

  async function fetchSellerPlan(sellerId) {
    try {
      const res = await fetch(`/api/seller/plan?sellerId=${sellerId}`);
      const data = await res.json();
      setSellerPlan(data.plan || null);
    } catch (err) {
      // Plan fetch failed, use defaults
    }
  }

  async function fetchListingCount() {
    try {
      const res = await fetch('/api/seller/listing-count', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setListingCount({ count: data.count || 0, limit: data.limit || 1 });
    } catch (err) {
      // Ignore
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!seller) {
      alert('Seller profile not loaded. Please try again.');
      return;
    }

    if (!form.city?.trim() || !form.state?.trim()) {
      alert('City and State are required.');
      return;
    }
    if (listingCount.count >= listingCount.limit && form.status === 'available') {
      alert(`Your plan allows ${listingCount.limit} active listing${listingCount.limit === 1 ? '' : 's'}. Upgrade to add more.`);
      return;
    }

    const maxPhotos = getPhotoLimit(sellerPlan);
    if (photos.length > maxPhotos) {
      alert(`Your plan allows ${maxPhotos} photos. Upgrade for 15 photos.`);
      return;
    }

    // Parse price and mileage, stripping commas
    const cleanPrice = form.price.replace(/,/g, '');
    const cleanMileage = form.mileage ? form.mileage.replace(/,/g, '') : '';

    const res = await fetch('/api/trucks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        seller_id: seller.id,
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        mileage: cleanMileage ? parseInt(cleanMileage) : null,
        price: parseFloat(cleanPrice),
        description: form.description || null,
        vin: form.vin || null,
        status: form.status,
        condition: form.condition || null,
        city: form.city || null,
        state: form.state || null,
        photos,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      router.push('/dashboard');
    } else if (data.error === 'EMAIL_VERIFICATION_REQUIRED') {
      router.push('/verify-email?required=1');
    } else if (data.error === 'PROFILE_INCOMPLETE') {
      router.push('/seller/profile?required=1');
    } else if (data.error === 'LISTING_LIMIT_REACHED') {
      alert(data.message || 'Listing limit reached. Upgrade to add more.');
    } else {
      alert(data.error || data.message || 'Failed to add truck');
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const maxPhotos = getPhotoLimit(sellerPlan);
  const isPaid = sellerPlan && sellerPlan.plan_type !== 'free' && (!sellerPlan.plan_expires || new Date(sellerPlan.plan_expires) > new Date());
  const atLimit = listingCount.count >= listingCount.limit && form.status === 'available';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/dashboard" className="text-primary-600 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Add New Truck</h1>
      <p className="text-slate-600 mb-8">
        Listing as <strong>{seller?.name}</strong> ({seller?.email})
        {' · '}
        {listingCount.count} of {listingCount.limit} active listing{listingCount.limit === 1 ? '' : 's'}
        {atLimit && form.status === 'available' && (
          <> · <Link href={`/upgrade-seller/${seller?.id}`} className="text-amber-700 font-medium hover:underline">Upgrade to list more</Link></>
        )}
        {' · '}
        <Link href="/seller/profile" className="text-primary-600 hover:underline">
          Edit Profile
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Make *</label>
            <select
              required
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value, model: '' })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">Select make</option>
              {TRUCK_MAKES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
            {form.make === 'Other' || (form.make && form.model && !getModelsForMake(form.make).includes(form.model)) ? (
              <input
                type="text"
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Enter model"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            ) : (
              <select
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="">Select model</option>
                {getModelsForMake(form.make).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year *</label>
            <select
              required
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">Select year</option>
              {TRUCK_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Condition *</label>
            <select
              required
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">Select condition</option>
              {TRUCK_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mileage</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              placeholder="50,000"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder={seller?.city ? '' : 'e.g. Tulsa'}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder={seller?.state ? '' : 'e.g. OK'}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              maxLength={2}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price ($) *</label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="25,000.00"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">VIN</label>
            <input
              type="text"
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
              placeholder="1FTEW1EP..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Describe your truck's condition, features, and history..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Photos
          </label>
          <p className="text-slate-500 text-sm mb-2">
            {isPaid ? (
              <span className="text-primary-600">Pro Seller: Up to {maxPhotos} photos</span>
            ) : (
              <>
                {maxPhotos} photos max
                {' · '}
                <Link href={`/upgrade-seller/${seller?.id}`} className="text-primary-600 hover:underline">
                  Upgrade to Pro for 15 photos
                </Link>
              </>
            )}
          </p>
          <PhotoUpload
            photos={photos}
            onChange={setPhotos}
            maxPhotos={maxPhotos}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Want more visibility?</h3>
          <p className="text-slate-600 text-sm mb-3">
            Boost your listing to appear at the top of search results and the homepage.
          </p>
          <p className="text-slate-500 text-sm">
            After listing, you can boost from your dashboard for <strong>$29 for 7 days</strong>.
          </p>
        </div>

        <button
          type="submit"
          disabled={atLimit}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          List Truck
        </button>
      </form>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
