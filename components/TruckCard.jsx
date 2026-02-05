import Link from 'next/link';
import SaveTruckButton from './SaveTruckButton';

export default function TruckCard({ truck, isSaved, onSaveToggle, showSaveButton, isOwner }) {
  const photos = truck.photos && Array.isArray(truck.photos) ? truck.photos : [];
  const mainPhoto = photos[0] || '/placeholder-truck.jpg';
  const seller = truck.seller;

  return (
    <div className="relative">
      <Link href={`/trucks/${truck.id}`} className="block">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-card-hover hover:border-slate-300 transition-all duration-300 group cursor-pointer relative">
          <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
            <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-1 items-end">
              {truck.sellerIsPro && (
                <span className="bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
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
              <span className="text-white text-base font-bold bg-red-600 px-3 py-1 rounded">SOLD</span>
            </div>
          )}
            {(truck.is_featured && (!truck.featured_until || new Date(truck.featured_until) > new Date())) && (
              <span className="absolute top-1.5 left-1.5 bg-accent-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded">Featured</span>
            )}
          </div>
          <div className="p-3">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition flex-1 min-w-0 truncate">
              {truck.year} {truck.make} {truck.model}
            </h3>
            {seller && (
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                {seller.profile_picture_url ? (
                  <img src={seller.profile_picture_url} alt={seller.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] font-bold">
                    {seller.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-slate-600 text-xs mt-0.5">
            {(truck.vehicle_condition || truck.condition) && <span className="capitalize">{truck.vehicle_condition || truck.condition}</span>}
            {(truck.vehicle_condition || truck.condition) && truck.mileage && ' · '}
            {truck.mileage ? `${truck.mileage.toLocaleString()} mi` : ((truck.vehicle_condition || truck.condition) ? null : 'N/A mi')}
            {(truck.city || truck.state) && (
              <span className="block text-slate-500 text-[10px] mt-0.5">
                {[truck.city, truck.state].filter(Boolean).join(', ')}
              </span>
            )}
          </p>
            <p className="text-primary-600 font-bold text-base mt-2">
              ${Number(truck.price).toLocaleString()}
            </p>
          </div>
        </div>
      </Link>
      {isOwner && (
        <div className="absolute bottom-2 right-2 z-10 flex gap-1.5">
          <Link
            href={`/seller/trucks/${truck.id}/edit`}
            className="bg-white/95 hover:bg-white text-slate-700 px-2 py-1 rounded text-xs font-medium shadow border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          {!(truck.is_featured && truck.featured_until && new Date(truck.featured_until) > new Date()) && (
            <Link
              href={`/boost-listing/${truck.id}`}
              className="bg-amber-500/95 hover:bg-amber-500 text-slate-900 px-2 py-1 rounded text-xs font-medium shadow"
              onClick={(e) => e.stopPropagation()}
            >
              Boost
            </Link>
          )}
        </div>
      )}
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
