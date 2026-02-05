import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import FinancingForm from '../../components/FinancingForm';
import Ads from '../../components/Ads';
import SellerContactCard from '../../components/SellerContactCard';
import SaveTruckButton from '../../components/SaveTruckButton';
import MessageButton from '../../components/MessageButton';

export default function TruckDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [truck, setTruck] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerPlan, setSellerPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showFinancing, setShowFinancing] = useState(false);
  const [user, setUser] = useState(null);
  const [currentSeller, setCurrentSeller] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/seller/profile').then((r) => r.json()).then((d) => {
        if (d.seller) setCurrentSeller(d.seller);
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && id) {
      fetch('/api/saved')
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && d.truckIds) setIsSaved(d.truckIds.includes(id));
        });
    }
  }, [user, id]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data: truckData } = await supabase.from('truck_trucks').select('*').eq('id', id).single();
      setTruck(truckData);
      if (truckData?.seller_id) {
        const { data: sellerData } = await supabase.from('truck_sellers').select('*').eq('id', truckData.seller_id).single();
        setSeller(sellerData);
        const res = await fetch(`/api/seller/plan?sellerId=${truckData.seller_id}`);
        const planData = await res.json();
        setSellerPlan(planData.plan);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading || !truck) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const photos = truck.photos && Array.isArray(truck.photos) ? truck.photos : [];
  const mainPhoto = photos[activePhoto] || 'https://via.placeholder.com/800x500?text=Truck';
  const isOwner = !!currentSeller && truck.seller_id === currentSeller.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium mb-6 inline-block">← Back to Listings</Link>

      {!user && (
        <div
          className="mb-6 bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between gap-4"
          role="alert"
        >
          <p className="text-primary-800 font-medium">
            Create a free account to save trucks you&apos;re interested in and easily find them later.
          </p>
          <Link
            href={`/signup?redirect=/trucks/${id}`}
            className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Sign Up Free
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="bg-slate-200 rounded-xl overflow-hidden aspect-[4/3] mb-4">
            <img
              src={mainPhoto}
              alt={`${truck.year} ${truck.make} ${truck.model}`}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/800x500?text=Truck'; }}
            />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    activePhoto === i ? 'border-primary-600' : 'border-slate-300'
                  }`}
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900">
              {truck.year} {truck.make} {truck.model}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isOwner && (
                <>
                  <Link
                    href={`/seller/trucks/${truck.id}/edit`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2 px-4 rounded-lg transition text-sm"
                  >
                    Edit
                  </Link>
                  {!(truck.is_featured && truck.featured_until && new Date(truck.featured_until) > new Date()) && (
                    <Link
                      href={`/boost-listing/${truck.id}`}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition text-sm"
                    >
                      Boost
                    </Link>
                  )}
                </>
              )}
              {user && (
                <SaveTruckButton
                  truckId={id}
                  isSaved={isSaved}
                  variant="detail"
                  onToggle={async (tid, saved) => {
                    const method = saved ? 'DELETE' : 'POST';
                    const res = await fetch(`/api/saved/${tid}`, { method, credentials: 'include' });
                    const data = await res.json();
                    if (data.ok) {
                      setIsSaved(!saved);
                    } else if (data.code === 'PROFILE_INCOMPLETE') {
                      router.push('/seller/profile?required=1');
                    }
                  }}
                />
              )}
            </div>
          </div>
          <p className="text-2xl font-bold text-primary-600 mt-2">
            ${Number(truck.price).toLocaleString()}
          </p>
          {truck.status === 'sold' && (
            <span className="inline-block mt-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">SOLD</span>
          )}
          {truck.is_featured && (!truck.featured_until || new Date(truck.featured_until) > new Date()) && (
            <span className="inline-block mt-2 ml-2 bg-accent-500/20 text-accent-600 px-3 py-1 rounded-full text-sm font-semibold">Featured</span>
          )}

          {truck.status === 'available' && isOwner && (
            <Link
              href={`/boost-listing/${truck.id}`}
              className="inline-block mt-2 bg-accent-500 hover:bg-accent-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition"
            >
              Boost this listing — $29 for 7 days
            </Link>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-slate-500 text-sm">Location</dt>
              <dd className="font-medium">{(truck.city || truck.state) ? [truck.city, truck.state].filter(Boolean).join(', ') : '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-sm">Year</dt>
              <dd className="font-medium">{truck.year}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-sm">Condition</dt>
              <dd className="font-medium capitalize">{truck.vehicle_condition || truck.condition || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-sm">Mileage</dt>
              <dd className="font-medium">{truck.mileage?.toLocaleString() || 'N/A'} mi</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-sm">Make</dt>
              <dd className="font-medium">{truck.make}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-sm">Model</dt>
              <dd className="font-medium">{truck.model}</dd>
            </div>
            {truck.vin && (
              <div className="col-span-2">
                <dt className="text-slate-500 text-sm">VIN</dt>
                <dd className="font-medium">{truck.vin}</dd>
              </div>
            )}
          </dl>

          {truck.description && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{truck.description}</p>
            </div>
          )}

          {seller && (
            <>
              <SellerContactCard
                seller={seller}
                sellerPlan={sellerPlan}
                truckName={`${truck.year} ${truck.make} ${truck.model}`}
              />
              {seller.user_id && (
                <div className="mt-4">
                  <MessageButton
                    sellerId={seller.user_id}
                    sellerName={seller.name}
                    truckId={truck.id}
                    truckTitle={`${truck.year} ${truck.make} ${truck.model}`}
                    user={user ? { id: user.id || user.user_id } : null}
                    className="w-full justify-center"
                  />
                </div>
              )}
            </>
          )}

          {truck.status === 'available' && (
            <div className="mt-8 space-y-4">
              <h3 className="font-semibold text-slate-900">Apply for Financing</h3>
              {user ? (
                <>
                  <button
                    onClick={() => setShowFinancing(!showFinancing)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                  >
                    {showFinancing ? 'Hide Financing Form' : 'Apply for Financing'}
                  </button>
                  {showFinancing && (
                    <div className="mt-4">
                      <FinancingForm truckId={truck.id} truckName={`${truck.year} ${truck.make} ${truck.model}`} user={user} />
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-slate-700 mb-4">You need an account to apply for financing.</p>
                  <Link
                    href={`/login?redirect=/trucks/${truck.id}`}
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Log in or Sign up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sponsored</h3>
          <Ads placement="truck_detail" />
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
