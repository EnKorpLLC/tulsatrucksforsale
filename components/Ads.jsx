import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PLACEMENTS = {
  homepage: 'homepage',
  niche: 'niche',
  listings: 'listings',
  truck_detail: 'truck_detail',
};

export default function Ads({ placement }) {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    if (!placement || !PLACEMENTS[placement]) return;
    async function fetchAds() {
      const now = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('truck_ads')
        .select('*')
        .eq('placement', placement)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);
      setAds(data || []);
    }
    fetchAds();
  }, [placement]);

  if (!ads.length) return null;

  return (
    <aside className="ads-container" data-placement={placement}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.link_url || '#'}
            target={ad.link_url?.startsWith('http') ? '_blank' : undefined}
            rel={ad.link_url?.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="block rounded-lg overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-shadow"
          >
            <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x225?text=Ad'; }}
              />
            </div>
            {ad.title && (
              <div className="p-3">
                <p className="font-medium text-slate-900 text-sm line-clamp-1">{ad.title}</p>
              </div>
            )}
          </a>
        ))}
      </div>
    </aside>
  );
}
