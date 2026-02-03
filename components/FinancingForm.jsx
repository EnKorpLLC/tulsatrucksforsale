import { useState } from 'react';

export default function FinancingForm({ truckId, truckName, user }) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    down_payment: '',
    credit_score: '',
    referral_source: '',
    notes: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          truck_id: truckId,
          truck_name: truckName,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
        setForm({ phone: '', down_payment: '', credit_score: '', referral_source: '', notes: '' });
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (err) {
      alert('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
        <p className="font-semibold">Thank you!</p>
        <p className="text-sm mt-1">Your financing inquiry has been submitted. We will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {user && (
        <p className="text-slate-600 text-sm mb-2">Applying as {user.name || user.email}</p>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Down Payment ($)</label>
        <input
          type="number"
          value={form.down_payment}
          onChange={(e) => setForm({ ...form, down_payment: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Credit Score (optional)</label>
        <input
          type="number"
          min="300"
          max="850"
          placeholder="e.g. 650"
          value={form.credit_score}
          onChange={(e) => setForm({ ...form, credit_score: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Referral Source (optional)</label>
        <input
          type="text"
          placeholder="How did you hear about us?"
          value={form.referral_source}
          onChange={(e) => setForm({ ...form, referral_source: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Inquiry'}
      </button>
    </form>
  );
}
