import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';

export default function SellerProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    company: '',
    seller_type: '',
    city: '',
    state: '',
    hide_email: false,
    hide_phone: false,
  });

  // Check if redirected from trying to list a truck
  const fromListing = router.query.required === '1';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login?redirect=/seller/profile');
          return;
        }
        setUser(data.user);
        // Pre-fill name from user profile
        setForm((prev) => ({ ...prev, name: data.user.name || '' }));
      });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    // Fetch existing seller profile if any
    fetch('/api/seller/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.seller) {
          setForm({
            name: data.seller.name || user.name || '',
            phone: data.seller.phone || '',
            company: data.seller.company || '',
            seller_type: data.seller.seller_type || '',
            city: data.seller.city || '',
            state: data.seller.state || '',
            hide_email: data.seller.hide_email || false,
            hide_phone: data.seller.hide_phone || false,
          });
          setProfilePictureUrl(data.seller.profile_picture_url || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.phone.trim()) {
      setError('Phone number is required so buyers can contact you');
      return;
    }
    if (!form.seller_type) {
      setError('Please select whether you are a private seller or a dealer');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/seller/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, profile_picture_url: profilePictureUrl || null }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess('Profile saved!');
        // If they came from trying to list a truck, redirect them to the add truck page
        if (fromListing) {
          setTimeout(() => router.push('/seller/trucks/new'), 500);
        }
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/dashboard" className="text-primary-600 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Seller Profile</h1>
      <p className="text-slate-600 mb-8">
        {fromListing
          ? 'Please complete your profile before listing a truck.'
          : 'Update your seller information. This will be shown to potential buyers.'}
      </p>

      {fromListing && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6">
          <strong>Almost there!</strong> Complete your profile to list your truck for sale.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Profile Photo
          </label>
          <ProfilePictureUpload
            currentUrl={profilePictureUrl}
            onUpload={setProfilePictureUrl}
            disabled={saving}
          />
          <p className="text-slate-500 text-sm mt-2">
            Shown on your truck listings. Helps build trust with buyers.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Doe"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-slate-500 text-sm mt-1">
            This name will be shown on your truck listings.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-slate-500 text-sm mt-1">
            Buyers will use this number to contact you about your trucks.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            I am a <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="seller_type"
                value="private"
                checked={form.seller_type === 'private'}
                onChange={(e) => setForm({ ...form, seller_type: e.target.value })}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span>Private seller</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="seller_type"
                value="dealer"
                checked={form.seller_type === 'dealer'}
                onChange={(e) => setForm({ ...form, seller_type: e.target.value })}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span>Dealer</span>
            </label>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            This helps buyers filter listings. Private sellers list their own trucks; dealers represent a business.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Company/Dealership Name <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="ABC Motors"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-slate-500 text-sm mt-1">
            Leave blank if you&apos;re a private seller.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Tulsa"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-slate-500 text-sm mt-1">Used to pre-fill your listings.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="OK"
              maxLength={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Contact Visibility Settings */}
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Contact Visibility</h3>
          <p className="text-slate-500 text-sm mb-4">
            Choose which contact options buyers can see on your listings. The Message button will always be available.
          </p>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hide_email}
                onChange={(e) => setForm({ ...form, hide_email: e.target.checked })}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
              />
              <div>
                <span className="font-medium text-slate-700">Do Not Show Email Option</span>
                <p className="text-slate-500 text-sm">Hide the &quot;Email&quot; button on your listings. Buyers won&apos;t see your email address.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hide_phone}
                onChange={(e) => setForm({ ...form, hide_phone: e.target.checked })}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
              />
              <div>
                <span className="font-medium text-slate-700">Do Not Show Call or Text Option</span>
                <p className="text-slate-500 text-sm">Hide the &quot;Call&quot; and &quot;Text&quot; buttons on your listings. Your phone number won&apos;t be visible to buyers.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-slate-500 text-sm mb-4">
            <strong>Email:</strong> {user?.email}
            <br />
            <span className="text-xs text-slate-400">(Email is tied to your account and cannot be changed here)</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {saving ? 'Saving...' : fromListing ? 'Save & Continue to List Truck' : 'Save Profile'}
        </button>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete account</h3>
          <p className="text-slate-600 text-sm mb-4">
            Permanently delete your account and all your listings. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Are you sure? This will permanently delete your account and all your listings. This cannot be undone.')) return;
              const res = await fetch('/api/account/delete', { method: 'POST', credentials: 'include' });
              const data = await res.json();
              if (data.ok) {
                window.location.href = '/';
              } else {
                alert(data.error || 'Failed to delete account');
              }
            }}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Delete my account
          </button>
        </div>
      </form>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
