import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function MessagesInbox() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login?redirect=/messages');
        } else {
          setUser(data.user);
        }
      });
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  async function fetchConversations() {
    setLoading(true);
    try {
      const res = await fetch('/api/messages/conversations');
      const data = await res.json();
      if (data.ok) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    setLoading(false);
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
        <title>Messages | Tulsa Trucks</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <Link
            href="/messages/blocked"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Blocked Users
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-100 rounded-lg h-24 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No messages yet</h3>
            <p className="text-slate-600 mb-4">
              When you message a seller about a truck, your conversations will appear here.
            </p>
            <Link
              href="/"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition"
            >
              Browse Trucks
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`block bg-white border rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition ${
                  conv.unreadCount > 0 ? 'border-primary-400 bg-primary-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Profile picture or truck photo */}
                  <div className="flex-shrink-0">
                    {conv.truck?.photo ? (
                      <img
                        src={conv.truck.photo}
                        alt={conv.truck.title}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : conv.otherUser.profilePicture ? (
                      <img
                        src={conv.otherUser.profilePicture}
                        alt={conv.otherUser.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-xl font-semibold text-slate-500">
                          {conv.otherUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                        {conv.otherUser.name}
                      </h3>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatDate(conv.lastMessageAt)}
                      </span>
                    </div>

                    {conv.truck && (
                      <p className="text-sm text-primary-600 mb-1 truncate">
                        Re: {conv.truck.title}
                      </p>
                    )}

                    {conv.lastMessage && (
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                        {conv.lastMessage.isFromMe && <span className="text-slate-400">You: </span>}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
