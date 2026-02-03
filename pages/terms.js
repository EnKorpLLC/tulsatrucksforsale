import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms & Conditions | Tulsa Trucks</title>
        <meta name="description" content="Terms and Conditions for Tulsa Trucks marketplace." />
      </Head>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium mb-6 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms & Conditions</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-US')}</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">1. Agreement to Terms</h2>
            <p>By accessing or using Tulsa Trucks (&quot;the Site&quot;), a service operated by EnKorp LLC, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Site.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">2. Use of the Marketplace</h2>
            <p>Tulsa Trucks is a marketplace connecting private sellers of trucks with potential buyers. You may browse listings, create an account, list vehicles, save favorites, apply for financing, and purchase advertising or seller plans. You agree to use the Site lawfully and not to misrepresent listings, harass users, or violate any applicable laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">3. User Accounts</h2>
            <p>To list trucks, save favorites, apply for financing, or purchase ads, you must create an account and provide accurate information. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">4. Listings and Transactions</h2>
            <p>Sellers are responsible for the accuracy of their listings. Tulsa Trucks does not guarantee the condition, title, or legality of listed vehicles. All transactions are between buyers and sellers; Tulsa Trucks acts as a platform only and is not a party to sales. Financing applications are processed through third-party partners.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">5. Payments and Fees</h2>
            <p>Payments for featured listings, seller plans (Pro, Pro+, Dealer), and advertising are processed through Stripe. Fees are non-refundable unless otherwise stated. Seller plan subscriptions renew according to the selected billing cycle.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">6. Advertising</h2>
            <p>Paid advertisements are subject to approval. Tulsa Trucks reserves the right to reject or remove ads that violate our policies or applicable law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">7. Prohibited Conduct</h2>
            <p>You may not: post false or misleading listings; use the Site for fraud; harass other users; scrape or automate access without permission; circumvent listing limits or fees; or use the Site in any way that harms Tulsa Trucks, other users, or third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">8. Intellectual Property</h2>
            <p>The Site, its content, and branding are owned by EnKorp LLC. You may not copy, modify, or distribute our content without permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">9. Disclaimer of Warranties</h2>
            <p>The Site is provided &quot;as is.&quot; Tulsa Trucks disclaims all warranties, express or implied, including merchantability and fitness for a particular purpose. We do not warrant uninterrupted or error-free service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">10. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Tulsa Trucks and EnKorp LLC shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Site or any transaction conducted through it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">11. Changes</h2>
            <p>We may update these Terms at any time. Continued use of the Site after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">12. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:team@tulsatrucksforsale.com" className="text-primary-600 hover:underline">team@tulsatrucksforsale.com</a>.</p>
          </section>

        </div>
      </div>
    </>
  );
}
