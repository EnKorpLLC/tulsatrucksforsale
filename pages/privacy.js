import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Tulsa Trucks</title>
        <meta name="description" content="Privacy Policy for Tulsa Trucks marketplace." />
      </Head>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium mb-6 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-US')}</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">1. Who We Are</h2>
            <p>Tulsa Trucks (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by EnKorp LLC. This Privacy Policy explains how we collect, use, and protect your information when you use our marketplace at tulsatrucksforsale.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">2. Information We Collect</h2>
            <p><strong>Account and profile:</strong> When you sign up, we collect your email, name, and (for sellers) phone, company, and profile picture. We also collect information you provide in listings (truck details, photos, location) and when applying for financing (down payment, credit score, etc.).</p>
            <p><strong>Usage data:</strong> We collect information about how you use the Site, including pages visited and actions taken. We may use cookies and similar technologies.</p>
            <p><strong>Payment information:</strong> Payment processing is handled by Stripe. We do not store full credit card numbers; Stripe&apos;s privacy policy applies to payment data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">3. How We Use Your Information</h2>
            <p>We use your information to: operate the marketplace; display your listings and profile to other users; process payments; send transactional emails (listings, receipts, verification); respond to financing inquiries; improve the Site; and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">4. Sharing Your Information</h2>
            <p>We may share information with: <strong>sellers/buyers</strong> (as needed for transactions); <strong>financing partners</strong> (when you apply for financing); <strong>Stripe</strong> (for payments); <strong>Resend</strong> (for email delivery); and <strong>Supabase</strong> (database hosting). We do not sell your personal information to third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">5. Data Security</h2>
            <p>We use industry-standard measures to protect your data, including HTTPS, secure authentication, and limited access to personal information. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">6. Your Rights</h2>
            <p>Depending on your location, you may have the right to: access your data; correct inaccuracies; request deletion; restrict or object to processing; and (where applicable) data portability. Contact us to exercise these rights. You may also unsubscribe from marketing emails at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">7. Cookies</h2>
            <p>We use cookies and similar technologies for authentication, session management, and analytics. You can control cookies through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">8. Children</h2>
            <p>The Site is not intended for users under 18. We do not knowingly collect information from children.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">9. Changes</h2>
            <p>We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the &quot;Last updated&quot; date. Continued use of the Site after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">10. Contact</h2>
            <p>Questions about privacy? Contact us at <a href="mailto:team@tulsatrucksforsale.com" className="text-primary-600 hover:underline">team@tulsatrucksforsale.com</a>.</p>
          </section>

        </div>
      </div>
    </>
  );
}
