import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function SellYourTruck() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user));
  }, []);

  return (
    <>
      <Head>
        <title>Sell Your Truck in Tulsa | Private Seller Marketplace</title>
        <meta name="description" content="List your truck for sale in Tulsa. Free listing for private sellers. Commercial trucks, semis, pickups—reach buyers and connect with financing partners. Simple process, no dealership fees." />
        <meta name="keywords" content="sell truck Tulsa, list truck for sale, private seller trucks, commercial trucks Tulsa" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sell Your Truck For Free!
            </h1>
            <p className="text-xl text-slate-200 mb-8">
              Tulsa&apos;s marketplace for private sellers. List your commercial truck, semi, or pickup—reach serious buyers and connect them with financing.
            </p>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-block bg-accent-500 hover:bg-accent-400 text-slate-900 font-bold py-4 px-8 rounded-lg transition"
              >
                Go to My Dashboard
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-block bg-accent-500 hover:bg-accent-400 text-slate-900 font-bold py-4 px-8 rounded-lg transition"
              >
                Get Started — Free
              </Link>
            )}
          </div>
        </section>

        {/* Process */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">How It Works</h2>
          <p className="text-slate-600 mb-12">Four simple steps from listing to sale</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">1</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Create an Account</h3>
                <p className="text-slate-600">Sign up free in minutes. No fees to list.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">2</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Add Your Truck</h3>
                <p className="text-slate-600">Upload photos, set your price, and add details. List commercial trucks, semis, pickups—whatever you&apos;re selling.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">3</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Buyers Find You</h3>
                <p className="text-slate-600">Your listing appears in search. Buyers can contact you directly or apply for financing through our partners.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">4</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Close the Deal</h3>
                <p className="text-slate-600">Mark your truck as pending or sold. You handle the sale—we connect you with buyers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Why Sell With Us</h2>
            <p className="text-slate-600 mb-12">Built for private sellers who want a simple, fair marketplace</p>

            <ul className="space-y-6">
              <li className="flex gap-4">
                <span className="text-accent-500 text-2xl">✓</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Free to List</h3>
                  <p className="text-slate-600">No listing fees. No hidden charges. You set the price.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-accent-500 text-2xl">✓</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Financing for Buyers</h3>
                  <p className="text-slate-600">Buyers can apply for financing through our partner lenders—more qualified leads for you.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-accent-500 text-2xl">✓</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Optional Boost & Pro</h3>
                  <p className="text-slate-600">Want more visibility? Boost a listing or upgrade to Pro Seller for top placement and more photos.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-primary-900 text-white rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Sell?</h2>
            <p className="text-slate-200 mb-8">Join Tulsa&apos;s trusted marketplace for private truck sellers.</p>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-block bg-accent-500 hover:bg-accent-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition"
              >
                Go to Dashboard
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
