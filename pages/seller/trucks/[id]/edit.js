import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';
import { getPhotoLimit, getListingLimit, isProSeller } from '../../../../lib/sellerPlan';
import PhotoUpload from '../../../../components/PhotoUpload';

export default function EditTruck() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerPlan, setSellerPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [truck, setTruck] = useState(null);
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
    city: '',
    state: '',
  });
  const [listingCount, setListingCount] = useState({ count: 0, limit: 1 });

  // Check if user is logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login?redirect=' + encodeURIComponent(`/seller/trucks/${id}/edit`));
          return;
        }
        setUser(data.user);
      });
  }, [router, id]);

  // Load user's seller profile
  useEffect(() => {
    if (!user) return;
    fetch('/api/seller/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.seller) {
          setSeller(data.seller);
          fetchSellerPlan(data.seller.id);
          fetchListingCount();
        }
      });
  }, [user]);

  // Load the truck
  useEffect(() => {
    if (!id || !seller) return;

    supabase.from('truck_trucks').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) {
        alert('Truck not found');
        router.replace('/dashboard');
        return;
      }

      // Verify this truck belongs to the current user's seller profile
      if (data.seller_id !== seller.id) {
        alert('You can only edit your own trucks');
        router.replace('/dashboard');
        return;
      }

      setTruck(data);
      setPhotos(data.photos || []);
      setForm({
        make: data.make || '',
        model: data.model || '',
        year: data.year || '',
        mileage: data.mileage || '',
        price: data.price || '',
        description: data.description || '',
        vin: data.vin || '',
        status: data.status || 'available',
        city: data.city || '',
        state: data.state || '',
      });
      setLoading(false);
    });
  }, [id, seller, router]);

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
    } catch (err) {}
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const maxPhotos = getPhotoLimit(sellerPlan);
    if (photos.length > maxPhotos) {
      alert(`Your plan allows ${maxPhotos} photos. Upgrade for 15 photos.`);
      return;
    }

    const newStatus = form.status;
    const oldStatus = truck?.status;
    if (newStatus === 'available' && oldStatus !== 'available') {
      const otherAvailable = await supabase
        .from('truck_trucks')
        .select('id')
        .eq('seller_id', seller.id)
        .eq('status', 'available')
        .neq('id', id);
      const limit = getListingLimit(sellerPlan);
      if ((otherAvailable.data?.length || 0) >= limit) {
        alert(`Your plan allows ${limit} active listing${limit === 1 ? '' : 's'}. Upgrade to add more.`);
        return;
      }
    }

    const { error } = await supabase
      .from('truck_trucks')
      .update({
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        mileage: form.mileage ? parseInt(form.mileage) : null,
        price: parseFloat(form.price),
        description: form.description || null,
        vin: form.vin || null,
        status: form.status,
        city: form.city || null,
        state: form.state || null,
        photos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }
    router.push('/dashboard');
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const maxPhotos = getPhotoLimit(sellerPlan);
  const isPaid = isProSeller(sellerPlan);
  const isFeatured = truck?.is_featured && truck?.featured_until && new Date(truck.featured_until) > new Date();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/dashboard" className="text-primary-600 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Edit Truck</h1>
      <p className="text-slate-600 mb-8">
        Listing by <strong>{seller?.name}</strong>
        {' · '}
        <Link href="/seller/profile" className="text-primary-600 hover:underline">
          Edit Profile
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Make *</label>
            <input
              type="text"
              required
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
            <input
              type="text"
              required
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year *</label>
            <input
              type="number"
              required
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              min="1900"
              max="2030"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mileage</label>
            <input
              type="number"
              value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Price ($) *</label>
          <input
            type="number"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">VIN</label>
          <input
            type="text"
            value={form.vin}
            onChange={(e) => setForm({ ...form, vin: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
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
                {seller && (
                  <>
                    {' · '}
                    <Link href={`/upgrade-seller/${seller.id}`} className="text-primary-600 hover:underline">
                      Upgrade to Pro for 15 photos
                    </Link>
                  </>
                )}
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

        {/* Featured Status / Boost */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          {isFeatured ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-slate-900 px-2 py-1 rounded text-xs font-bold">
                  FEATURED
                </span>
                <span className="text-slate-600 text-sm">
                  Until {new Date(truck.featured_until).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                Your listing is boosted and appears at the top of search results.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Want more visibility?</h3>
              <p className="text-slate-600 text-sm mb-3">
                Boost your listing to appear at the top of search results and the homepage.
              </p>
              <Link
                href={`/boost-listing/${id}`}
                className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition text-sm"
              >
                Boost for $29 / 7 days
              </Link>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Save Changes
        </button>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Delete this listing? This cannot be undone.')) return;
              const res = await fetch(`/api/trucks/${id}`, { method: 'DELETE', credentials: 'include' });
              const data = await res.json();
              if (data.ok) router.push('/dashboard');
              else alert(data.error || 'Failed to delete');
            }}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Delete listing
          </button>
        </div>
      </form>
    </div>
  );
}
