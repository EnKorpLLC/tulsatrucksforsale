import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function BlockedUsers() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login?redirect=/messages/blocked');
        } else {
          setUser(data.user);
        }
      });
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
    }
  }, [user]);

  async function fetchBlockedUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/messages/block');
      const data = await res.json();
      if (data.ok) {
        setBlockedUsers(data.blockedUsers || []);
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
    setLoading(false);
  }

  async function handleUnblock(userId, name) {
    if (!confirm(`Unblock ${name}? They will be able to message you again.`)) return;

    try {
      const res = await fetch('/api/messages/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.ok) {
        setBlockedUsers(blockedUsers.filter(u => u.userId !== userId));
      } else {
        alert(data.error || 'Failed to unblock user');
      }
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert('Failed to unblock user');
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Blocked Users | Tulsa Trucks</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/messages" className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Blocked Users</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-slate-100 rounded-lg h-16 animate-pulse" />
            ))}
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
            <p className="text-slate-600">You haven&apos;t blocked anyone.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((blocked) => (
              <div
                key={blocked.userId}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{blocked.name}</h3>
                  <p className="text-sm text-slate-500">Blocked on {formatDate(blocked.blockedAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(blocked.userId, blocked.name)}
                  className="px-4 py-2 text-sm border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg transition"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// Disable static generation - this page requires authentication
export async function getServerSideProps() {
  return { props: {} };
}
