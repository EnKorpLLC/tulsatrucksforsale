import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import TruckCard from '../components/TruckCard';
import { getSellerPlansMap, enrichTrucksWithSellerPlan } from '../lib/sellerPlan';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('interested');
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [savedTrucks, setSavedTrucks] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [sellerPlan, setSellerPlan] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login?redirect=/dashboard');
          return;
        }
        setUser(data.user);
      });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchSellerProfile();
  }, [user]);

  async function fetchSellerProfile() {
    const res = await fetch('/api/seller/profile');
    const data = await res.json();

    if (data.seller) {
      setSeller(data.seller);
      fetchTrucks(data.seller.id);
      fetchSellerPlan(data.seller.id);
    }
    fetchSavedTrucks();
    setLoading(false);
  }

  async function fetchSavedTrucks() {
    const res = await fetch('/api/saved');
    const data = await res.json();
    if (!data.ok || !data.truckIds?.length) return;
    setSavedIds(new Set(data.truckIds));
    const { data: trucksData } = await supabase
      .from('truck_trucks')
      .select('*')
      .in('id', data.truckIds);
    const list = data.truckIds.map((id) => (trucksData || []).find((t) => t.id === id)).filter(Boolean);
    const sellerIds = list.map((t) => t.seller_id).filter(Boolean);
    const { data: sellersData } = sellerIds.length > 0
      ? await supabase.from('truck_sellers').select('id, name, profile_picture_url').in('id', sellerIds)
      : { data: [] };
    const sellersMap = (sellersData || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
    const plansMap = await getSellerPlansMap(sellerIds);
    const withSellers = list.map((t) => ({ ...t, seller: sellersMap[t.seller_id] }));
    setSavedTrucks(enrichTrucksWithSellerPlan(withSellers, plansMap));
  }

  async function fetchTrucks(sellerId) {
    const { data } = await supabase
      .from('truck_trucks')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    setTrucks(data || []);
  }

  async function fetchSellerPlan(sellerId) {
    try {
      const res = await fetch(`/api/seller/plan?sellerId=${sellerId}`);
      const data = await res.json();
      setSellerPlan(data.plan || null);
    } catch (err) {
      // Plan fetch failed, ignore
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const isPro = sellerPlan && sellerPlan.plan_type !== 'free' && (!sellerPlan.plan_expires || new Date(sellerPlan.plan_expires) > new Date());
  const hasCompleteProfile = seller && seller.phone;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          {user && (
            <p className="text-slate-600 mt-1">
              Welcome back, {user.name || user.email}
            </p>
          )}
        </div>
        {isPro && (
          <span className="mt-2 sm:mt-0 inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {sellerPlan?.plan_type === 'dealer' ? 'Dealer' : sellerPlan?.plan_type === 'pro_plus' ? 'Pro+' : 'Pro'} Seller
          </span>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="font-semibold text-slate-900 text-lg">Profile</h2>
          <Link
            href="/seller/profile"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 sm:mt-0"
          >
            Edit Profile →
          </Link>
        </div>

        {hasCompleteProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Name:</span>
              <span className="ml-2 text-slate-900 font-medium">{seller.name}</span>
            </div>
            <div>
              <span className="text-slate-500">Phone:</span>
              <span className="ml-2 text-slate-900 font-medium">{seller.phone}</span>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>
              <span className="ml-2 text-slate-900 font-medium">{seller.email}</span>
            </div>
            {seller.company && (
              <div className="sm:col-span-3">
                <span className="text-slate-500">Company:</span>
                <span className="ml-2 text-slate-900 font-medium">{seller.company}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 font-medium mb-2">Complete your profile to get started</p>
            <p className="text-amber-700 text-sm mb-4">
              Add your phone number to list trucks, save favorites, and leave reviews.
            </p>
            <Link
              href="/seller/profile?required=1"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition"
            >
              Complete Profile
            </Link>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="font-semibold text-slate-900 text-lg mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/seller/trucks/new"
            className={`inline-flex items-center gap-2 font-semibold px-4 py-2 rounded-lg transition ${
              hasCompleteProfile
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            onClick={(e) => {
              if (!hasCompleteProfile) {
                e.preventDefault();
                router.push('/seller/profile?required=1');
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Truck
          </Link>

          {seller && !isPro && (
            <Link
              href={`/upgrade-seller/${seller.id}`}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade to Pro
            </Link>
          )}

          <Link
            href="/advertise/buy"
            className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Buy an Ad
          </Link>
        </div>
      </div>

      {/* Plan Benefits */}
      {!isPro && seller && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-8 border border-primary-200">
          <h3 className="font-semibold text-primary-900 mb-2">Upgrade Your Plan</h3>
          <p className="text-primary-800 text-sm mb-4">Free: 1 active listing. Pro: 3 · Pro+: 6 · Dealer: 25</p>
          <ul className="text-primary-800 text-sm space-y-1 mb-4">
            <li>✓ Your listings appear above free sellers</li>
            <li>✓ Upload up to 15 photos per listing (vs 6)</li>
            <li>✓ Pro/Pro+/Dealer badge on your listings</li>
          </ul>
          <Link
            href={`/upgrade-seller/${seller.id}`}
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            View plans from $19.99/month
          </Link>
        </div>
      )}

      {/* Tabs: Trucks I'm Interested In | My Trucks */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('interested')}
            className={`pb-3 font-medium border-b-2 transition ${
              activeTab === 'interested'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Trucks I&apos;m Interested In
          </button>
          <button
            onClick={() => setActiveTab('my-trucks')}
            className={`pb-3 font-medium border-b-2 transition ${
              activeTab === 'my-trucks'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Trucks
          </button>
        </nav>
      </div>

      {activeTab === 'interested' && (
        <>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Trucks I&apos;m Interested In</h2>
          {hasCompleteProfile ? (
            savedTrucks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTrucks.map((truck) => (
                  <div key={truck.id} className="relative">
                    <TruckCard
                      truck={truck}
                      showSaveButton
                      isSaved={savedIds.has(truck.id)}
                      onSaveToggle={async (tid, saved) => {
                        const method = saved ? 'DELETE' : 'POST';
                        const res = await fetch(`/api/saved/${tid}`, { method, credentials: 'include' });
                        const data = await res.json();
                        if (data.ok) {
                          setSavedIds((prev) => {
                            const next = new Set(prev);
                            if (saved) next.delete(tid);
                            else next.add(tid);
                            return next;
                          });
                          setSavedTrucks((prev) => prev.filter((t) => t.id !== tid));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-slate-600 mb-4">No saved trucks yet.</p>
                <p className="text-slate-500 text-sm mb-4">Browse listings and click the save icon on trucks you like.</p>
                <Link
                  href="/listings"
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                >
                  Browse Trucks
                </Link>
              </div>
            )
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 font-medium mb-2">Complete your profile to save trucks</p>
              <p className="text-amber-700 text-sm mb-4">Add your phone number to start saving trucks you&apos;re interested in.</p>
              <Link
                href="/seller/profile?required=1"
                className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition"
              >
                Complete Profile
              </Link>
            </div>
          )}
        </>
      )}

      {activeTab === 'my-trucks' && (
        <>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">My Trucks</h2>
          {hasCompleteProfile ? (
            trucks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trucks.map((truck) => (
                  <div key={truck.id} className="relative">
                    <TruckCard truck={truck} />
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      <Link
                        href={`/seller/trucks/${truck.id}/edit`}
                        className="bg-white/90 hover:bg-white text-slate-800 px-3 py-1 rounded text-sm font-medium shadow"
                      >
                        Edit
                      </Link>
                      {!truck.is_featured && (
                        <Link
                          href={`/boost-listing/${truck.id}`}
                          className="bg-amber-500/90 hover:bg-amber-500 text-slate-900 px-3 py-1 rounded text-sm font-medium shadow"
                        >
                          Boost
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Delete this listing? This cannot be undone.')) return;
                          const res = await fetch(`/api/trucks/${truck.id}`, { method: 'DELETE', credentials: 'include' });
                          const data = await res.json();
                          if (data.ok) fetchTrucks(seller.id);
                          else alert(data.error || 'Failed to delete');
                        }}
                        className="bg-red-500/90 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-medium shadow"
                      >
                        Delete
                      </button>
                    </div>
                    {truck.is_featured && truck.featured_until && new Date(truck.featured_until) > new Date() && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-amber-500 text-slate-900 px-2 py-1 rounded text-xs font-bold shadow">
                          FEATURED
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-slate-600 mb-4">You haven&apos;t listed any trucks yet.</p>
                <Link
                  href="/seller/trucks/new"
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                >
                  List Your First Truck
                </Link>
              </div>
            )
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 font-medium mb-2">Complete your profile to list trucks</p>
              <Link
                href="/seller/profile?required=1"
                className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition"
              >
                Complete Profile
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
