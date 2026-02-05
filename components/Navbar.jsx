import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auth, setAuth] = useState({ user: null, role: null });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setAuth({ user: data.user, role: data.role }));
  }, []);

  async function handleLogout(e) {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuth({ user: null, role: null });
    window.location.href = '/';
  }

  const user = auth.user;

  return (
    <>
      {/* Top bar - dealership style */}
      <div className="bg-primary-900 text-white text-sm py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <span>Tulsa&apos;s trusted marketplace for private truck sellers</span>
          <a href="mailto:team@tulsatrucksforsale.com" className="hover:text-accent-400 transition">
            team@tulsatrucksforsale.com
          </a>
        </div>
      </div>

      {/* Main nav */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-primary-700 hover:text-primary-600 transition"
              >
                Tulsa Trucks
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-slate-700 hover:text-primary-600 font-medium transition">
                Home
              </Link>
              {!user && (
                <>
                  <Link href="/advertise" className="text-slate-700 hover:text-primary-600 font-medium transition">
                    Advertise
                  </Link>
                  <Link href="/sell" className="text-slate-700 hover:text-primary-600 font-medium transition">
                    Sell Your Truck
                  </Link>
                </>
              )}
              {user ? (
                <div className="flex items-center gap-4">
                  <Link
                    href={auth.role === 'admin' ? '/admin' : '/dashboard'}
                    className="text-slate-600 hover:text-primary-600 font-medium transition"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-slate-600 hover:text-slate-900 font-medium transition"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-slate-600 hover:text-primary-600 font-medium transition">
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {mobileOpen && (
            <div className="md:hidden py-4 border-t border-slate-100 space-y-1" role="menu">
              <Link href="/" className="block py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium" onClick={() => setMobileOpen(false)}>Home</Link>
              {!user && (
                <>
                  <Link href="/advertise" className="block py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium" onClick={() => setMobileOpen(false)}>Advertise</Link>
                  <Link href="/sell" className="block py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium" onClick={() => setMobileOpen(false)}>Sell Your Truck</Link>
                </>
              )}
              {user ? (
                <>
                  <Link
                    href={auth.role === 'admin' ? '/admin' : '/dashboard'}
                    className="block py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button onClick={(e) => { setMobileOpen(false); handleLogout(e); }} className="block w-full text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium">
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium" onClick={() => setMobileOpen(false)}>Log In</Link>
                  <Link href="/signup" className="block py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
