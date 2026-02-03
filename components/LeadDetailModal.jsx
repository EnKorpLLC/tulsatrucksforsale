import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'sent_to_lender', label: 'Sent to Lender' },
  { value: 'closed', label: 'Closed' },
];

export default function LeadDetailModal({ lead, onClose, onUpdate }) {
  const [leadStatus, setLeadStatus] = useState(lead?.lead_status || 'new');
  const [notes, setNotes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lead?.id) return;
    setLeadStatus(lead.lead_status || 'new');
    fetchNotesAndActivity();
  }, [lead?.id]);

  async function fetchNotesAndActivity() {
    if (!lead?.id) return;
    const [notesRes, activityRes] = await Promise.all([
      supabase.from('truck_financing_request_notes').select('*').eq('financing_request_id', lead.id).order('created_at', { ascending: false }),
      supabase.from('financing_request_activity').select('*').eq('financing_request_id', lead.id).order('created_at', { ascending: false }),
    ]);
    setNotes(notesRes.data || []);
    setActivity(activityRes.data || []);
    setLoading(false);
  }

  async function handleStatusChange(newStatus) {
    const oldStatus = leadStatus;
    setLeadStatus(newStatus);
    await supabase.from('truck_financing_requests').update({ lead_status: newStatus }).eq('id', lead.id);
    await supabase.from('financing_request_activity').insert({
      financing_request_id: lead.id,
      activity_type: 'status_change',
      description: `Status changed from ${oldStatus || 'new'} to ${newStatus}`,
      metadata: { from: oldStatus, to: newStatus },
    });
    fetchNotesAndActivity();
    onUpdate?.();
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmitting(true);
    await supabase.from('truck_financing_request_notes').insert({
      financing_request_id: lead.id,
      content: newNote.trim(),
    });
    await supabase.from('financing_request_activity').insert({
      financing_request_id: lead.id,
      activity_type: 'note_added',
      description: `Note added`,
      metadata: { preview: newNote.trim().slice(0, 50) },
    });
    setNewNote('');
    setSubmitting(false);
    fetchNotesAndActivity();
    onUpdate?.();
  }

  if (!lead) return null;

  const buyer = lead.buyer || {};
  const truck = lead.truck || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Lead: {buyer.name || 'Unknown'}</h3>
            <p className="text-slate-600 text-sm mt-1">
              {truck.year} {truck.make} {truck.model} • {new Date(lead.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Contact</h4>
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
              <p><span className="text-slate-500">Email:</span> {buyer.email || '-'}</p>
              <p><span className="text-slate-500">Phone:</span> {buyer.phone || '-'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">Details</h4>
            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1">
              <p><span className="text-slate-500">Down payment:</span> ${lead.down_payment ? Number(lead.down_payment).toLocaleString() : '-'}</p>
              <p><span className="text-slate-500">Credit score:</span> {lead.credit_score || '-'}</p>
              <p><span className="text-slate-500">Referral:</span> {lead.referral_source || '-'}</p>
              {lead.notes && <p><span className="text-slate-500">Initial notes:</span> {lead.notes}</p>}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-900 mb-2">Status</label>
            <select
              value={leadStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">Add Note</h4>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={submitting || !newNote.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg text-sm disabled:opacity-50 self-end"
              >
                Add
              </button>
            </form>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">Notes History</h4>
            {loading ? (
              <p className="text-slate-500 text-sm">Loading...</p>
            ) : notes.length === 0 ? (
              <p className="text-slate-500 text-sm">No notes yet.</p>
            ) : (
              <div className="space-y-3 max-h-32 overflow-y-auto">
                {notes.map((n) => (
                  <div key={n.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                    <p className="text-slate-900">{n.content}</p>
                    <p className="text-slate-400 text-xs mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">Activity Log</h4>
            {loading ? (
              <p className="text-slate-500 text-sm">Loading...</p>
            ) : activity.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity yet.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activity.map((a) => (
                  <div key={a.id} className="flex gap-3 text-sm py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-400 shrink-0 w-36">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                    <span className="text-slate-700">{a.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
