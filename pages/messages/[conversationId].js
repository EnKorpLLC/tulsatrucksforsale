import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ConversationThread() {
  const router = useRouter();
  const { conversationId } = router.query;
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

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
    if (user && conversationId) {
      fetchMessages();
      markAsRead();
    }
  }, [user, conversationId]);

  const prevMessageCountRef = useRef(0);

  // Only scroll to bottom on initial load or when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!user || !conversationId) return;
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [user, conversationId]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function fetchMessages(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      const data = await res.json();
      if (data.ok) {
        setConversation(data.conversation);
        // Only update if there are actually new messages
        const newMessages = data.messages || [];
        if (!silent || newMessages.length !== messages.length) {
          setMessages(newMessages);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    if (!silent) setLoading(false);
  }

  async function markAsRead() {
    try {
      await fetch(`/api/messages/${conversationId}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() })
      });
      const data = await res.json();
      if (data.ok) {
        setMessages([...messages, data.message]);
        setNewMessage('');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    }
    setSending(false);
  }

  async function handleBlock() {
    if (!confirm(`Block ${conversation?.otherUser?.name}? They won't be able to message you.`)) return;

    try {
      const res = await fetch('/api/messages/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: conversation.otherUser.id })
      });
      const data = await res.json();
      if (data.ok) {
        alert('User blocked');
        router.push('/messages');
      } else {
        alert(data.error || 'Failed to block user');
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Failed to block user');
    }
    setShowActions(false);
  }

  async function handleReport(e) {
    e.preventDefault();
    if (!reportReason) {
      alert('Please select a reason');
      return;
    }

    setReportSubmitting(true);
    try {
      const res = await fetch('/api/messages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          reportedUserId: conversation.otherUser.id,
          reason: reportReason,
          details: reportDetails.trim()
        })
      });
      const data = await res.json();
      if (data.ok) {
        alert('Report submitted. Our team will review it.');
        setShowReportModal(false);
        setReportReason('');
        setReportDetails('');
      } else {
        alert(data.error || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report');
    }
    setReportSubmitting(false);
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }

  // Group messages by date
  function getMessageGroups() {
    const groups = [];
    let currentDate = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msg.createdAt });
      }
      groups.push({ type: 'message', ...msg });
    });

    return groups;
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Conversation not found</p>
          <Link href="/messages" className="text-primary-600 hover:underline">
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  const messageGroups = getMessageGroups();

  return (
    <>
      <Head>
        <title>Chat with {conversation.otherUser.name} | Tulsa Trucks</title>
      </Head>

      <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
          <Link href="/messages" className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            {conversation.otherUser.profilePicture ? (
              <img
                src={conversation.otherUser.profilePicture}
                alt={conversation.otherUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-lg font-semibold text-slate-500">
                  {conversation.otherUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900 truncate">{conversation.otherUser.name}</h2>
              {conversation.truck && (
                <Link href={`/trucks/${conversation.truck.id}`} className="text-sm text-primary-600 hover:underline truncate block">
                  {conversation.truck.title}
                </Link>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    type="button"
                    onClick={() => { setShowReportModal(true); setShowActions(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Report User
                  </button>
                  <button
                    type="button"
                    onClick={handleBlock}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Block User
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Truck context card */}
        {conversation.truck && (
          <Link href={`/trucks/${conversation.truck.id}`} className="block bg-slate-50 border-b border-slate-200 px-4 py-3 hover:bg-slate-100 transition">
            <div className="flex items-center gap-3">
              {conversation.truck.photo && (
                <img
                  src={conversation.truck.photo}
                  alt={conversation.truck.title}
                  className="w-16 h-12 rounded object-cover"
                />
              )}
              <div>
                <p className="font-medium text-slate-900">{conversation.truck.title}</p>
                {conversation.truck.price && (
                  <p className="text-sm text-slate-600">${Number(conversation.truck.price).toLocaleString()}</p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Blocked notice */}
        {conversation.isBlocked && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-center">
            <p className="text-red-700 text-sm">
              {conversation.blockedByMe 
                ? 'You have blocked this user.' 
                : 'This user has blocked you.'}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messageGroups.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${idx}`} className="flex justify-center">
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {formatDate(item.date)}
                  </span>
                </div>
              );
            }

            const isFromMe = item.isFromMe;
            return (
              <div
                key={item.id}
                className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isFromMe
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-900 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{item.content}</p>
                  <p className={`text-xs mt-1 ${isFromMe ? 'text-primary-200' : 'text-slate-400'}`}>
                    {formatTime(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        {!conversation.isBlocked && (
          <form onSubmit={handleSend} className="bg-white border-t border-slate-200 px-4 py-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition"
              >
                {sending ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Report User</h3>
            <form onSubmit={handleReport}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="harassment">Harassment or bullying</option>
                  <option value="spam">Spam</option>
                  <option value="scam">Scam or fraud</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Additional details (optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Describe what happened..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowReportModal(false); setReportReason(''); setReportDetails(''); }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Disable static generation - this page requires authentication
export async function getServerSideProps() {
  return { props: {} };
}
