import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (router.isReady) {
      router.replace('/login?redirect=/admin');
    }
  }, [router, router.isReady]);
  return null;
}

export async function getServerSideProps() {
  return { props: {} };
}
