import '../styles/globals.css';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }) {
  // Skip layout for error pages
  if (Component.noLayout) {
    return <Component {...pageProps} />;
  }
  
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
