import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VerifyEmail() {
  const router = useRouter();
  const { token, required } = router.query;
  const [status, setStatus] = useState(token ? 'loading' : 'request');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!token) return;
    setStatus('loading');
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((r) => r.json())
      .then((data) => setStatus(data.ok ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [token]);

  async function handleSendVerification(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-verification', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.ok) setSent(true);
      else alert(data.error || 'Failed to send');
    } catch {
      alert('Failed to send verification email');
    }
    setSending(false);
  }

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'request') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h1>
        {required && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            You need to verify your email before listing a truck or purchasing an ad.
          </p>
        )}
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <p className="text-green-800 font-medium">Verification email sent!</p>
            <p className="text-slate-600 text-sm mt-2">Check your inbox and click the link. It expires in 24 hours.</p>
          </div>
        ) : (
          <p className="text-slate-600 mb-6">We&apos;ll send a verification link to your email. Click it to verify your account.</p>
        )}
        {!sent && (
          <button
            onClick={handleSendVerification}
            disabled={sending}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Verification Email'}
          </button>
        )}
        <p className="mt-6 text-center">
          <Link href="/dashboard" className="text-primary-600 hover:underline">Back to Dashboard</Link>
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-medium mb-4">Invalid or expired link. Request a new verification email.</p>
        <Link href="/verify-email" className="text-primary-600 hover:underline">Request new verification email</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-6">
        <p className="text-4xl mb-2">✓</p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Email Verified</h1>
        <p className="text-slate-600">You can now list trucks and buy ads.</p>
      </div>
      <Link href="/dashboard" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg">
        Go to Dashboard
      </Link>
    </div>
  );
}
