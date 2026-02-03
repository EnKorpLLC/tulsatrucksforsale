import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SellerDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-[200px]">
      <p className="text-slate-500">Redirecting to dashboard...</p>
    </div>
  );
}
