import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import TruckCard from '../../components/TruckCard';
import Ads from '../../components/Ads';
import { getSellerPlansMap, enrichTrucksWithSellerPlan } from '../../lib/sellerPlan';

export default function Listings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    status: 'available',
  });

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/saved').then((r) => r.json()).then((d) => {
        if (d.ok && d.truckIds) setSavedIds(new Set(d.truckIds));
      });
    }
  }, [user]);

  useEffect(() => {
    fetchTrucks();
  }, [filters]);

  async function fetchTrucks() {
    setLoading(true);
    let query = supabase.from('truck_trucks').select('*');

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.make) query = query.ilike('make', `%${filters.make}%`);
    if (filters.model) query = query.ilike('model', `%${filters.model}%`);
    if (filters.minYear) query = query.gte('year', parseInt(filters.minYear));
    if (filters.maxYear) query = query.lte('year', parseInt(filters.maxYear));
    if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice));
    if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice));

    query = query.order('created_at', { ascending: false });
    const { data } = await query;
    const trucksData = data || [];
    const sellerIds = [...new Set(trucksData.map((t) => t.seller_id).filter(Boolean))];
    const plansMap = await getSellerPlansMap(sellerIds);
    const { data: sellersData } = sellerIds.length > 0
      ? await supabase.from('truck_sellers').select('id, name, profile_picture_url').in('id', sellerIds)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse Trucks</h1>
      <p className="text-slate-600 mb-8">Find commercial trucks, semis, pickups and more from private sellers</p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-900">Filters</h2>
          <button
            type="button"
            onClick={() => setFilters({ make: '', model: '', minYear: '', maxYear: '', minPrice: '', maxPrice: '', status: 'available' })}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium"
          >
            Clear all
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
            <input
              type="text"
              placeholder="e.g. Peterbilt"
              value={filters.make}
              onChange={(e) => setFilters({ ...filters, make: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
            <input
              type="text"
              placeholder="e.g. 579"
              value={filters.model}
              onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Year</label>
            <input
              type="number"
              placeholder="2015"
              value={filters.minYear}
              onChange={(e) => setFilters({ ...filters, minYear: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Year</label>
            <input
              type="number"
              placeholder="2024"
              value={filters.maxYear}
              onChange={(e) => setFilters({ ...filters, maxYear: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Price ($)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Price ($)</label>
            <input
              type="number"
              placeholder="200000"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-200 rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : trucks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trucks.map((truck) => (
            <TruckCard
              key={truck.id}
              truck={truck}
              showSaveButton={!!user}
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
                } else if (data.code === 'PROFILE_INCOMPLETE') {
                  router.push('/seller/profile?required=1');
                } else if (data.code === 'LOGIN_REQUIRED') {
                  router.push('/login?redirect=/listings');
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-slate-600">No trucks match your filters.</p>
        </div>
      )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sponsored</h3>
          <Ads placement="listings" />
        </div>
      </div>
    </div>
  );
}
