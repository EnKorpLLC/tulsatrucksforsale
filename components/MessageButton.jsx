import { useState } from 'react';
import { useRouter } from 'next/router';

export default function MessageButton({ sellerId, sellerName, truckId, truckTitle, user, className = '' }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Default message based on truck
  const defaultMessage = truckTitle 
    ? `Hi, I'm interested in your ${truckTitle}. Is it still available?`
    : `Hi, I'm interested in one of your listings.`;

  function handleClick() {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // Can't message yourself
    if (user.id === sellerId) {
      return;
    }

    setMessage(defaultMessage);
    setShowModal(true);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: sellerId,
          truckId: truckId || null,
          message: message.trim()
        })
      });
      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setMessage('');
        router.push(`/messages/${data.conversationId}`);
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    }
    setSending(false);
  }

  // Don't show if viewing your own listing
  if (user && user.id === sellerId) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Message {sellerName ? sellerName.split(' ')[0] : 'Seller'}
      </button>

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Message {sellerName || 'Seller'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowModal(false); setMessage(''); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {truckTitle && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-slate-600">About:</p>
                <p className="font-medium text-slate-900">{truckTitle}</p>
              </div>
            )}

            <form onSubmit={handleSend}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Your message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Write your message..."
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setMessage(''); }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
