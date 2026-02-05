import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ListingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-600">
      Redirecting...
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
