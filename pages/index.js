import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TruckCard from '../components/TruckCard';
import Ads from '../components/Ads';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [featuredTrucks, setFeaturedTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/homepage/featured')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.trucks) {
          setFeaturedTrucks(data.trucks);
        }
      })
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div>
      {/* Hero - dealership style with professional imagery feel */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')]"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Quality Trucks For Sale in Tulsa
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Private sellers list commercial trucks, semis, pickups and more. Find your next truck, connect with sellers, and apply for financing—all in one marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/listings"
                className="inline-flex items-center justify-center bg-accent-500 hover:bg-accent-600 text-slate-900 font-bold px-8 py-4 rounded-lg transition shadow-lg hover:shadow-xl"
              >
                Browse All Listings
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center justify-center border-2 border-white/40 hover:border-white text-white font-semibold px-8 py-4 rounded-lg transition"
              >
                List Your Truck
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges - dealership style */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600 mb-1">Quality</div>
              <p className="text-slate-600 text-sm font-medium">Vetted trucks from trusted private sellers</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600 mb-1">Financing</div>
              <p className="text-slate-600 text-sm font-medium">Apply online with our financing partners</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600 mb-1">Support</div>
              <p className="text-slate-600 text-sm font-medium">We help connect buyers and sellers</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600 mb-1">Local</div>
              <p className="text-slate-600 text-sm font-medium">Tulsa-area marketplace</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured trucks section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Featured Trucks</h2>
          <p className="text-slate-600">Handpicked listings from our private seller marketplace</p>
        </div>

        {/* Sponsored ads - only show if we have ads */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sponsored</h3>
          <Ads placement="homepage" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-100 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : featuredTrucks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTrucks.map((truck) => (
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
                    router.push('/login?redirect=/');
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
            <p className="text-slate-600 mb-4">No featured trucks yet. Be the first to list!</p>
            <Link href="/listings" className="inline-block text-primary-600 font-semibold hover:text-primary-700 hover:underline">
              View All Listings →
            </Link>
          </div>
        )}
      </section>

      {/* CTA section */}
      <section className="bg-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Find Your Next Truck?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">Browse our full inventory, connect with sellers, and apply for financing—all in one place.</p>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center bg-accent-500 hover:bg-accent-600 text-slate-900 font-bold px-8 py-4 rounded-lg transition shadow-lg"
          >
            Browse All Listings
          </Link>
        </div>
      </section>
    </div>
  );
}
