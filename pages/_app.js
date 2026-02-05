import '../styles/globals.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  
  // Skip layout for error pages
  if (Component.noLayout) {
    return <Component {...pageProps} />;
  }

  // Hide footer for messaging pages (native messenger feel)
  const hideFooter = router.pathname.startsWith('/messages');
  
  return (
    <Layout hideFooter={hideFooter}>
      <Component {...pageProps} />
    </Layout>
  );
}
