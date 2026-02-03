import { useState, useRef } from 'react';

export default function ProfilePictureUpload({ currentUrl, onUpload, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image (JPEG, PNG, WebP, GIF)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile photo must be under 2MB');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('for', 'profile');

    try {
      const res = await fetch('/api/upload/photo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();

      if (data.ok && data.url) {
        onUpload(data.url);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
        {currentUrl ? (
          <img src={currentUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
            {uploading ? '…' : '?'}
          </div>
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || disabled}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : currentUrl ? 'Change photo' : 'Add photo'}
        </button>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    </div>
  );
}
