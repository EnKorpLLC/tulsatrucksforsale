import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import AdminAdsForm from '../../components/AdminAdsForm';
import LeadDetailModal from '../../components/LeadDetailModal';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('stats');
  const [trucks, setTrucks] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [financing, setFinancing] = useState([]);
  const [notes, setNotes] = useState([]);
  const [rules, setRules] = useState([]);
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [adsModal, setAdsModal] = useState(null);
  const [leadModal, setLeadModal] = useState(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.admin) router.replace('/login?redirect=/admin');
        else setAuthChecked(true);
      });
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    loadAll();
  }, [authChecked]);

  async function loadAll() {
    setLoading(true);
    const [t, s, f, n, r, a, statsRes] = await Promise.all([
      supabase.from('truck_trucks').select('*, seller:truck_sellers(name, email)').order('created_at', { ascending: false }),
      supabase.from('truck_sellers').select('*').order('name'),
      supabase.from('truck_financing_requests').select('*, truck:truck_trucks(make, model, year), buyer:truck_buyers(name, email, phone)').order('created_at', { ascending: false }),
      supabase.from('truck_tasks_notes').select('*').order('created_at', { ascending: false }),
      supabase.from('truck_automation_rules').select('*').order('name'),
      supabase.from('truck_ads').select('*').order('created_at', { ascending: false }),
      fetch('/api/admin/stats').then((r) => r.json()),
    ]);
    setTrucks(t.data || []);
    setSellers(s.data || []);
    setFinancing(f.data || []);
    setNotes(n.data || []);
    setRules(r.data || []);
    setAds(a.data || []);
    setStats(statsRes);
    setLoading(false);
  }

  async function updateLeadStatus(id, status, prevStatus) {
    await supabase.from('truck_financing_requests').update({ lead_status: status }).eq('id', id);
    await supabase.from('truck_financing_request_activity').insert({
      financing_request_id: id,
      activity_type: 'status_change',
      description: `Status changed from ${prevStatus || 'new'} to ${status}`,
      metadata: { from: prevStatus, to: status },
    });
    loadAll();
  }

  async function deleteTruck(id) {
    if (!confirm('Delete this truck?')) return;
    await supabase.from('truck_trucks').delete().eq('id', id);
    loadAll();
  }

  async function saveAd(data) {
    if (adsModal?.id) {
      await supabase.from('truck_ads').update(data).eq('id', adsModal.id);
    } else {
      await supabase.from('truck_ads').insert(data);
    }
    setAdsModal(null);
    loadAll();
  }

  async function approveAd(id) {
    await supabase.from('truck_ads').update({ is_active: true }).eq('id', id);
    loadAll();
  }

  async function deleteAd(id) {
    if (!confirm('Delete this ad?')) return;
    await supabase.from('truck_ads').delete().eq('id', id);
    loadAll();
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  if (!authChecked) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <button onClick={logout} className="text-slate-600 hover:text-slate-900 text-sm">Logout</button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
        {['stats', 'trucks', 'featured', 'sellers', 'financing', 'ads', 'notes', 'rules'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium capitalize rounded-t-lg transition ${
              tab === t ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      ) : (
        <>
          {tab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-slate-500 text-sm font-medium mb-2">Total Trucks</div>
                  <div className="text-3xl font-bold text-slate-900">{stats.stats.totalTrucks}</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-slate-500 text-sm font-medium mb-2">Featured Active</div>
                  <div className="text-3xl font-bold text-amber-600">{stats.stats.featuredActive}</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-slate-500 text-sm font-medium mb-2">Pro Sellers</div>
                  <div className="text-3xl font-bold text-primary-600">{stats.stats.proSellers}</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-slate-500 text-sm font-medium mb-2">Financing Requests</div>
                  <div className="text-3xl font-bold text-slate-900">{stats.stats.financingRequests}</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-slate-500 text-sm font-medium mb-2">Active Ads</div>
                  <div className="text-3xl font-bold text-slate-900">{stats.stats.activeAds}</div>
                </div>
              </div>

              {/* Revenue Cards */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Revenue</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-700 text-sm font-medium mb-1">Boosted Listings</div>
                    <div className="text-2xl font-bold text-green-900">${stats.revenue.boost.toFixed(2)}</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-700 text-sm font-medium mb-1">Seller Plans</div>
                    <div className="text-2xl font-bold text-blue-900">${stats.revenue.seller_plan.toFixed(2)}</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-purple-700 text-sm font-medium mb-1">Ads</div>
                    <div className="text-2xl font-bold text-purple-900">${stats.revenue.ad.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900 text-white rounded-lg p-4">
                    <div className="text-slate-300 text-sm font-medium mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold">${stats.revenue.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setTab('financing')}
                    className="bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold py-3 px-4 rounded-lg transition text-left"
                  >
                    <div className="text-sm">View Financing Leads</div>
                    <div className="text-xs text-primary-600 mt-1">{stats.stats.financingRequests} total</div>
                  </button>
                  <button
                    onClick={() => setTab('featured')}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-3 px-4 rounded-lg transition text-left"
                  >
                    <div className="text-sm">Manage Featured Listings</div>
                    <div className="text-xs text-amber-600 mt-1">{stats.stats.featuredActive} active</div>
                  </button>
                  <button
                    onClick={() => setTab('ads')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-lg transition text-left"
                  >
                    <div className="text-sm">Manage Ads</div>
                    <div className="text-xs text-slate-600 mt-1">{stats.stats.activeAds} active</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'trucks' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Truck</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Seller</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {trucks.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3">
                          <Link href={`/trucks/${t.id}`} className="text-amber-600 hover:underline">
                            {t.year} {t.make} {t.model}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{t.seller?.name || '-'}</td>
                        <td className="px-4 py-3">${Number(t.price).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            t.status === 'sold' ? 'bg-red-100 text-red-800' :
                            t.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>{t.status}</span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <Link href={`/seller/trucks/${t.id}/edit`} className="text-amber-600 hover:underline text-sm">Edit</Link>
                          <button onClick={() => deleteTruck(t.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {trucks.length === 0 && <p className="p-8 text-center text-slate-500">No trucks</p>}
            </div>
          )}

          {tab === 'featured' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Featured Listings</h3>
                <p className="text-slate-500 text-sm mt-1">Paid featured trucks and their expiration dates.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Truck</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Featured Until</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {trucks
                      .filter((t) => t.is_featured)
                      .sort((a, b) => new Date(b.featured_until || 0) - new Date(a.featured_until || 0))
                      .map((t) => {
                        const expired = t.featured_until && new Date(t.featured_until) < new Date();
                        return (
                          <tr key={t.id} className={expired ? 'bg-slate-50' : ''}>
                            <td className="px-4 py-3">
                              <Link href={`/trucks/${t.id}`} className="text-primary-600 hover:underline">
                                {t.year} {t.make} {t.model}
                              </Link>
                            </td>
                            <td className="px-4 py-3">${Number(t.price).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {t.featured_until ? new Date(t.featured_until).toLocaleString() : 'No expiry'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${expired ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-800'}`}>
                                {expired ? 'Expired' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/boost-listing/${t.id}`} className="text-primary-600 hover:underline text-sm">Boost again</Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {trucks.filter((t) => t.is_featured).length === 0 && (
                <p className="p-8 text-center text-slate-500">No featured listings yet.</p>
              )}
            </div>
          )}

          {tab === 'sellers' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Company</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sellers.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-slate-600">{s.email}</td>
                        <td className="px-4 py-3 text-slate-600">{s.company || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sellers.length === 0 && <p className="p-8 text-center text-slate-500">No sellers</p>}
            </div>
          )}

          {tab === 'financing' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Leads / Financing Requests</h3>
                <p className="text-slate-500 text-sm mt-1">Click a lead to open CRM details, add notes, and track activity.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Truck</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Buyer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Down / Credit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Referral</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {financing.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          {f.truck ? `${f.truck.year} ${f.truck.make} ${f.truck.model}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div>{f.buyer?.name}</div>
                          <div className="text-sm text-slate-500">{f.buyer?.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          ${f.down_payment ? Number(f.down_payment).toLocaleString() : '-'} / {f.credit_score || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{f.referral_source || '-'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={f.lead_status || 'new'}
                            onChange={(e) => updateLeadStatus(f.id, e.target.value, f.lead_status || 'new')}
                            className="text-sm border border-slate-300 rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="sent_to_lender">Sent to Lender</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {new Date(f.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          {f.lead_status !== 'sent_to_lender' && f.lead_status !== 'closed' && (
                            <button
                              onClick={() => updateLeadStatus(f.id, 'sent_to_lender', f.lead_status || 'new')}
                              className="text-primary-600 hover:underline text-sm font-medium"
                            >
                              Send to Lender
                            </button>
                          )}
                          <button
                            onClick={() => setLeadModal(f)}
                            className="text-amber-600 hover:underline text-sm font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {financing.length === 0 && <p className="p-8 text-center text-slate-500">No leads yet.</p>}
              {leadModal && (
                <LeadDetailModal
                  lead={leadModal}
                  onClose={() => setLeadModal(null)}
                  onUpdate={loadAll}
                />
              )}
            </div>
          )}

          {tab === 'ads' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Ads</h3>
                <button onClick={() => setAdsModal({})} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg text-sm">
                  + Add Ad
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Placement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Active</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ads.map((ad) => (
                      <tr key={ad.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={ad.image_url} alt="" className="w-12 h-8 object-cover rounded" onError={(e) => { e.target.src = 'https://via.placeholder.com/48x32?text=Ad'; }} />
                            <span className="font-medium">{ad.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{ad.placement.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {ad.start_date || '—'} to {ad.end_date || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${ad.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                            {ad.is_active ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-2 flex-wrap">
                          {!ad.is_active && (
                            <button onClick={() => approveAd(ad.id)} className="text-green-600 hover:underline text-sm font-medium">Approve</button>
                          )}
                          <button onClick={() => setAdsModal(ad)} className="text-amber-600 hover:underline text-sm">Edit</button>
                          <button onClick={() => deleteAd(ad.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ads.length === 0 && <p className="p-8 text-center text-slate-500">No ads. Click &quot;Add Ad&quot; to create one.</p>}
              {adsModal !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAdsModal(null)}>
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold mb-4">{adsModal.id ? 'Edit Ad' : 'New Ad'}</h3>
                    <AdminAdsForm
                      ad={adsModal.id ? adsModal : undefined}
                      onSave={saveAd}
                      onCancel={() => setAdsModal(null)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4">
                {notes.map((n) => (
                  <div key={n.id} className="border-b border-slate-100 py-4 last:border-0">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{n.title}</h4>
                      <span className="text-xs text-slate-500">{n.type} • {new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{n.content}</p>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-slate-500">No notes</p>}
              </div>
            </div>
          )}

          {tab === 'rules' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4">
                {rules.map((r) => (
                  <div key={r.id} className="border-b border-slate-100 py-4 last:border-0 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{r.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${r.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="text-slate-500 text-sm">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {rules.length === 0 && <p className="text-slate-500">No automation rules</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
