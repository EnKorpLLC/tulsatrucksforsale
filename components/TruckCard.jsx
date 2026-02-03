import Link from 'next/link';
import SaveTruckButton from './SaveTruckButton';

export default function TruckCard({ truck, isSaved, onSaveToggle, showSaveButton }) {
  const photos = truck.photos && Array.isArray(truck.photos) ? truck.photos : [];
  const mainPhoto = photos[0] || '/placeholder-truck.jpg';
  const seller = truck.seller;

  return (
    <div className="relative">
      <Link href={`/trucks/${truck.id}`} className="block">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-card-hover hover:border-slate-300 transition-all duration-300 group cursor-pointer relative">
          <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
              {truck.sellerIsPro && (
                <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded">
                  {truck.sellerPlanTier === 'dealer' ? 'Dealer' : truck.sellerPlanTier === 'pro_plus' ? 'Pro+' : 'Pro'} Seller
                </span>
              )}
            </div>
            <img
            src={mainPhoto}
            alt={`${truck.year} ${truck.make} ${truck.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300/e2e8f0/64748b?text=Truck'; }}
          />
          {truck.status === 'sold' && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
              <span className="text-white text-xl font-bold bg-red-600 px-4 py-2 rounded">SOLD</span>
            </div>
          )}
            {(truck.is_featured && (!truck.featured_until || new Date(truck.featured_until) > new Date())) && (
              <span className="absolute top-3 left-3 bg-accent-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">Featured</span>
            )}
          </div>
          <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-600 transition flex-1 min-w-0">
              {truck.year} {truck.make} {truck.model}
            </h3>
            {seller && (
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                {seller.profile_picture_url ? (
                  <img src={seller.profile_picture_url} alt={seller.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                    {seller.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-slate-600 text-sm mt-1">
            {truck.mileage?.toLocaleString() || 'N/A'} mi
            {(truck.city || truck.state) && (
              <span className="block text-slate-500 text-xs mt-0.5">
                {[truck.city, truck.state].filter(Boolean).join(', ')}
              </span>
            )}
          </p>
            <p className="text-primary-600 font-bold text-xl mt-3">
              ${Number(truck.price).toLocaleString()}
            </p>
          </div>
        </div>
      </Link>
      {showSaveButton && onSaveToggle && (
        <SaveTruckButton
          truckId={truck.id}
          isSaved={!!isSaved}
          onToggle={onSaveToggle}
          variant="card"
        />
      )}
    </div>
  );
}
