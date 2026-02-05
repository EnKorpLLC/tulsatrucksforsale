import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TruckCard from '../components/TruckCard';
import Ads from '../components/Ads';
import { supabase } from '../lib/supabase';
import { getSellerPlansMap, enrichTrucksWithSellerPlan } from '../lib/sellerPlan';
import { TRUCK_MAKES, getModelsForMake, TRUCK_CONDITIONS } from '../lib/truckOptions';

const SESSION_KEY = 'tulsatrucks_seller_preference';

const DEFAULT_FILTERS = {
  make: '',
  model: '',
  minYear: '',
  maxYear: '',
  minPrice: '',
  maxPrice: '',
  status: 'available',
  condition: '',
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sellerPreference, setSellerPreference] = useState(null);
  const [showPreferencePopup, setShowPreferencePopup] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null;
    if (stored === 'dealer' || stored === 'private') {
      setSellerPreference(stored);
    } else {
      setShowPreferencePopup(true);
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/seller/profile').then((r) => r.json()).then((d) => {
        if (d.seller) setSeller(d.seller);
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetch('/api/saved').then((r) => r.json()).then((d) => {
        if (d.ok && d.truckIds) setSavedIds(new Set(d.truckIds));
      });
    }
  }, [user]);

  useEffect(() => {
    if (sellerPreference) fetchTrucks();
    else setLoading(false);
  }, [filters, sellerPreference]);

  function handleSellerPreference(choice) {
    if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_KEY, choice);
    setSellerPreference(choice);
    setShowPreferencePopup(false);
    setLoading(true);
  }

  async function fetchTrucks() {
    if (!sellerPreference) return;
    setLoading(true);
    let sellerIds = null;
    const { data: sellers } = await supabase.from('truck_sellers').select('id').eq('seller_type', sellerPreference);
    sellerIds = (sellers || []).map((s) => s.id);
    if (sellerIds.length === 0) {
      setTrucks([]);
      setLoading(false);
      return;
    }

    let query = supabase.from('truck_trucks').select('*').in('seller_id', sellerIds);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.condition) query = query.eq('vehicle_condition', filters.condition);
    if (filters.make) query = query.eq('make', filters.make);
    if (filters.model) query = query.eq('model', filters.model);
    if (filters.minYear) query = query.gte('year', parseInt(filters.minYear));
    if (filters.maxYear) query = query.lte('year', parseInt(filters.maxYear));
    if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice));
    if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice));

    query = query.order('created_at', { ascending: false });
    const { data } = await query;
    const trucksData = data || [];
    const truckSellerIds = [...new Set(trucksData.map((t) => t.seller_id).filter(Boolean))];
    const plansMap = await getSellerPlansMap(truckSellerIds);
    const { data: sellersData } = truckSellerIds.length > 0
      ? await supabase.from('truck_sellers').select('id, name, profile_picture_url').in('id', truckSellerIds)
      : { data: [] };
    const sellersMap = (sellersData || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
    const trucksWithSellers = trucksData.map((t) => ({ ...t, seller: sellersMap[t.seller_id] }));
    const enriched = enrichTrucksWithSellerPlan(trucksWithSellers, plansMap);
    const now = new Date();
    const tierOrder = { dealer: 4, pro_plus: 3, pro: 2, free: 1 };
    const tierRank = (t) => tierOrder[t.sellerPlanTier] || 1;
    const sorted = enriched.sort((a, b) => {
      const aFeatured = a.is_featured && (!a.featured_until || new Date(a.featured_until) > now);
      const bFeatured = b.is_featured && (!b.featured_until || new Date(b.featured_until) > now);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      const aTier = tierRank(a);
      const bTier = tierRank(b);
      if (aTier !== bTier) return bTier - aTier;
      return 0;
    });
    setTrucks(sorted);
    setLoading(false);
  }

  const featuredCount = trucks.filter((t) => t.is_featured && (!t.featured_until || new Date(t.featured_until) > new Date())).length;

  return (
    <div>
      {/* Seller preference popup - first visit */}
      {showPreferencePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" role="dialog" aria-modal="true" aria-labelledby="preference-title">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <h2 id="preference-title" className="text-xl font-bold text-slate-900 mb-2">What are you looking for?</h2>
            <p className="text-slate-600 mb-6">Choose how you&apos;d like to browse trucks for this session.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => handleSellerPreference('dealer')}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
              >
                Dealer Trucks
              </button>
              <button
                type="button"
                onClick={() => handleSellerPreference('private')}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition"
              >
                Private Party Trucks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero section */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tulsa Trucks Marketplace</h1>
              <p className="text-slate-600 text-sm mt-0.5">
                Commercial trucks, semis & pickups
                {sellerPreference && (
                  <span className="ml-1">
                    · Showing {sellerPreference === 'dealer' ? 'dealer' : 'private party'} trucks
                    <button
                      type="button"
                      onClick={() => { sessionStorage.removeItem(SESSION_KEY); setShowPreferencePopup(true); setSellerPreference(null); }}
                      className="ml-1 text-primary-600 hover:underline font-medium"
                    >
                      Change
                    </button>
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sell"
                className="inline-flex items-center border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg transition text-sm"
              >
                List Your Truck
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Collapsible filters */}
      <section className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full py-4 flex items-center justify-between text-left text-slate-700 hover:text-slate-900 font-medium"
          >
            <span>Filters</span>
            <svg
              className={`w-5 h-5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {filtersOpen && (
            <div className="pb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-slate-900">Filter listings</h2>
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
                  <select
                    value={filters.make}
                    onChange={(e) => setFilters({ ...filters, make: e.target.value, model: '' })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All makes</option>
                    {TRUCK_MAKES.filter((m) => m !== 'Other').map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <select
                    value={filters.model}
                    onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All models</option>
                    {getModelsForMake(filters.make).filter((m) => m !== 'Other').map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Year</label>
                  <input
                    type="number"
                    placeholder="2015"
                    value={filters.minYear}
                    onChange={(e) => setFilters({ ...filters, minYear: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Year</label>
                  <input
                    type="number"
                    placeholder="2024"
                    value={filters.maxYear}
                    onChange={(e) => setFilters({ ...filters, maxYear: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Price ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Price ($)</label>
                  <input
                    type="number"
                    placeholder="200000"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                  <select
                    value={filters.condition}
                    onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    {TRUCK_CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Truck grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {featuredCount > 0 && (
              <p className="text-sm text-slate-500 mb-4">
                Featured first · Boosted above standard · Pro sellers above free
              </p>
            )}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-slate-100 rounded-lg h-56 animate-pulse" />
                ))}
              </div>
            ) : trucks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {trucks.map((truck) => (
                  <TruckCard
                    key={truck.id}
                    truck={truck}
                    showSaveButton={!!user}
                    isSaved={savedIds.has(truck.id)}
                    isOwner={!!seller && truck.seller_id === seller.id}
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
                      } else if (data.code === 'PROFILE_INCOMPLETE') {
                        router.push('/seller/profile?required=1');
                      } else if (data.code === 'LOGIN_REQUIRED') {
                        router.push('/login?redirect=/');
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                <p className="text-slate-600 mb-4">No trucks match your filters.</p>
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-primary-600 hover:underline font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sponsored</h3>
            <Ads placement="homepage" />
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
