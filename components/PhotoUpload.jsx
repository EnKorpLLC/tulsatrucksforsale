import { useState, useRef } from 'react';

export default function PhotoUpload({ photos = [], onChange, maxPhotos = 6, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    setError('');
    setUploading(true);

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload images only (JPEG, PNG, WebP, GIF)');
        continue;
      }
      if (file.size > 6 * 1024 * 1024) {
        setError('Each photo must be under 6MB');
        continue;
      }

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const res = await fetch('/api/upload/photo', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const data = await res.json();

        if (data.ok && data.url) {
          onChange([...photos, data.url]);
        } else {
          setError(data.error || 'Upload failed');
        }
      } catch (err) {
        setError('Upload failed');
      }
    }

    setUploading(false);
    e.target.value = '';
  }

  function removePhoto(index) {
    onChange(photos.filter((_, i) => i !== index));
  }

  const canAdd = photos.length < maxPhotos && !disabled;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {photos.map((url, i) => (
          <div key={i} className="relative group">
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="w-24 h-24 object-cover rounded-lg border border-slate-200"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-bold flex items-center justify-center shadow"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:border-primary-500 hover:text-primary-600 transition disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-xs">Uploading...</span>
            ) : (
              <>
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">Add</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      <p className="text-slate-500 text-sm mt-1">
        {photos.length} / {maxPhotos} photos · JPEG, PNG, WebP, or GIF · Max 6MB each
      </p>
    </div>
  );
}
