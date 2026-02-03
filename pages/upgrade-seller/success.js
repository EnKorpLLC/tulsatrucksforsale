import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function UpgradeSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState('loading');
  const [sellerId, setSellerId] = useState(null);

  useEffect(() => {
    if (!session_id) {
      setStatus('error');
      return;
    }
    fetch(`/api/stripe/verify-seller-plan-session?session_id=${session_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus('success');
          setSellerId(data.sellerId);
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [session_id]);

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-slate-600">Confirming your payment...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-medium mb-4">Something went wrong. Please contact support if you were charged.</p>
        <Link href="/dashboard" className="text-primary-600 hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-6">
        <p className="text-3xl mb-2">✓</p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Payment successful!</h1>
        <p className="text-slate-600">You now have Pro Seller benefits. Your plan will renew automatically each month.</p>
      </div>
      <Link href="/dashboard" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg">
        Back to Dashboard
      </Link>
    </div>
  );
}
