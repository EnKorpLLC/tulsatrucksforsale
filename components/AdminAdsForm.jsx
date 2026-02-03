import { useState } from 'react';

const PLACEMENTS = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'niche', label: 'Niche / Service Pages' },
  { value: 'listings', label: 'Listings' },
  { value: 'truck_detail', label: 'Truck Detail' },
];

export default function AdminAdsForm({ ad, onSave, onCancel }) {
  const isEdit = !!(ad?.id);
  const [form, setForm] = useState({
    title: ad?.title || '',
    image_url: ad?.image_url || '',
    link_url: ad?.link_url || '',
    placement: ad?.placement || 'homepage',
    start_date: ad?.start_date ? ad.start_date.slice(0, 10) : '',
    end_date: ad?.end_date ? ad.end_date.slice(0, 10) : '',
    is_active: ad?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Image URL *</label>
        <input
          type="url"
          required
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Link URL</label>
        <input
          type="url"
          value={form.link_url}
          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Placement *</label>
        <select
          value={form.placement}
          onChange={(e) => setForm({ ...form, placement: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        >
          {PLACEMENTS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm font-medium text-slate-700">Active</span>
      </label>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
