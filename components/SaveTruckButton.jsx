import { useState } from 'react';

// Engine/save icon - bookmark style for "Trucks I'm Interested In"
function EngineIcon({ filled, ...props }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

export default function SaveTruckButton({
  truckId,
  isSaved,
  onToggle,
  disabled,
  variant = 'card',
  className = '',
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || loading) return;

    setLoading(true);
    try {
      await onToggle(truckId, isSaved);
    } finally {
      setLoading(false);
    }
  }

  const baseClass = variant === 'card'
    ? 'absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition z-10'
    : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition';

  const colorClass = isSaved
    ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
    : 'text-slate-600 hover:text-primary-600 hover:bg-slate-100';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseClass} ${colorClass} ${className} disabled:opacity-50`}
      aria-label={isSaved ? 'Remove from saved' : 'Save to Trucks I\'m Interested In'}
    >
      <EngineIcon filled={isSaved} aria-hidden />
      {variant === 'detail' && (
        <span>{loading ? '...' : isSaved ? 'Saved' : 'Save'}</span>
      )}
    </button>
  );
}
