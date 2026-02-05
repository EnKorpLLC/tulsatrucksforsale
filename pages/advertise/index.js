import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Advertise() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user));
  }, []);

  return (
    <>
      <Head>
        <title>Advertise on Tulsa Trucks | Reach Truck Buyers & Sellers</title>
        <meta name="description" content="Advertise your business on Tulsa's truck marketplace. Reach buyers and sellers of commercial trucks, semis, and pickups. Sponsored placements on homepage, listings, and truck detail pages. $99 for 30 days." />
        <meta name="keywords" content="advertise Tulsa trucks, truck advertising, commercial truck ads, Tulsa truck marketplace" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Advertise on Tulsa Trucks
            </h1>
            <p className="text-xl text-slate-200 mb-8">
              Get your business in front of truck buyers and sellers. Sponsored placements on our homepage, listings, and truck detail pages.
            </p>
            {user ? (
              <Link
                href="/advertise/buy"
                className="inline-block bg-accent-500 hover:bg-accent-400 text-slate-900 font-bold py-4 px-8 rounded-lg transition"
              >
                Buy an Ad
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-block bg-accent-500 hover:bg-accent-400 text-slate-900 font-bold py-4 px-8 rounded-lg transition"
              >
                Sign Up Free to Advertise
              </Link>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">How Advertising Works</h2>
          <p className="text-slate-600 mb-12">Simple process from signup to live ad</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">1</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Create an Account</h3>
                <p className="text-slate-600">Sign up for a free account. Advertisers must have an account so we can verify who&apos;s behind each ad.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">2</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Submit Your Ad</h3>
                <p className="text-slate-600">Choose your placement, add your creative and link. Pay $99 for 30 days via secure Stripe checkout.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">3</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">We Review & Approve</h3>
                <p className="text-slate-600">Our team reviews each ad to ensure it&apos;s appropriate. Approved ads go live within 1 business day.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Placements */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Ad Placements</h2>
            <p className="text-slate-600 mb-12">Choose where your ad appears</p>

            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Homepage</h3>
                <p className="text-slate-600">Your ad appears on the main landing page where visitors first arrive.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Listings Page</h3>
                <p className="text-slate-600">Sponsored slot in the sidebar while buyers browse all truck listings.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Truck Detail Pages</h3>
                <p className="text-slate-600">Reach buyers when they&apos;re viewing specific trucks and ready to act.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Simple Pricing</h2>
          <p className="text-slate-600 mb-8">$99 for 30 days. One placement per purchase. No hidden fees.</p>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 max-w-md">
            <p className="text-2xl font-bold text-primary-700">$99</p>
            <p className="text-slate-600 mt-1">per ad, 30 days</p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex gap-2"><span className="text-accent-500">✓</span> Choose your placement</li>
              <li className="flex gap-2"><span className="text-accent-500">✓</span> Your image and link</li>
              <li className="flex gap-2"><span className="text-accent-500">✓</span> Human review before going live</li>
              <li className="flex gap-2"><span className="text-accent-500">✓</span> Reach truck buyers and sellers</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-primary-900 text-white rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Advertise?</h2>
            <p className="text-slate-200 mb-8">Create a free account to purchase and manage your ads.</p>
            {user ? (
              <Link
                href="/advertise/buy"
                className="inline-block bg-accent-500 hover:bg-accent-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition"
              >
                Buy an Ad
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-block bg-accent-500 hover:bg-accent-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/login"
                  className="inline-block border border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-lg transition"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
