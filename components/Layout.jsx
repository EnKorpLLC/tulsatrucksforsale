import Navbar from './Navbar';
import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Tulsa Trucks For Sale | Private Seller Truck Marketplace</title>
        <meta name="description" content="Find quality trucks for sale in Tulsa. Private sellers list commercial trucks, semis, F-250s and more. Apply for financing." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b4a8a" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-primary-700 focus:rounded-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-white">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-300 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Tulsa Trucks</h3>
              <p className="text-sm text-slate-400">Your trusted marketplace for private sellers. List your truck, find buyers, and apply for financing—all in one place.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-slate-400 hover:text-white transition">Browse Trucks</Link></li>
                <li><Link href="/advertise" className="text-slate-400 hover:text-white transition">Advertise</Link></li>
                <li><Link href="/sell" className="text-slate-400 hover:text-white transition">Sell Your Truck For Free!</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-white transition">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy" className="text-slate-400 hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-sm text-slate-400">Email: team@tulsatrucksforsale.com</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Tulsa Trucks, an{' '}
            <a href="https://enkorpllc.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition" aria-label="EnKorp LLC Family Company (opens in new tab)">
              EnKorp LLC Family Company
            </a>
            . All Rights Reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
