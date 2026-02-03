import { supabase } from './supabase';

// Listing limits by plan: free=1, pro=3, pro_plus=6, dealer=25
const LISTING_LIMITS = {
  free: 1,
  pro: 3,
  pro_plus: 6,
  dealer: 25,
};

// Photo limits: free=6, all paid=15
const FREE_PHOTO_LIMIT = 6;
const PAID_PHOTO_LIMIT = 15;

// Plan prices (monthly)
export const PLAN_PRICES = {
  pro: 19.99,
  pro_plus: 39.99,
  dealer: 99.99,
};

export const PLAN_LABELS = {
  free: 'Free',
  pro: 'Pro',
  pro_plus: 'Pro+',
  dealer: 'Dealer',
};

export function getListingLimit(plan) {
  if (!plan) return LISTING_LIMITS.free;
  const tier = plan.plan_type || 'free';
  if (!plan.plan_expires) return LISTING_LIMITS[tier] ?? LISTING_LIMITS.free;
  if (new Date(plan.plan_expires) <= new Date()) return LISTING_LIMITS.free;
  return LISTING_LIMITS[tier] ?? LISTING_LIMITS.free;
}

export function isPaidSeller(plan) {
  if (!plan || plan.plan_type === 'free') return false;
  if (!plan.plan_expires) return true;
  return new Date(plan.plan_expires) > new Date();
}

export function isProSeller(plan) {
  return isPaidSeller(plan);
}

export function getPhotoLimit(plan) {
  return isProSeller(plan) ? PAID_PHOTO_LIMIT : FREE_PHOTO_LIMIT;
}

export async function getSellerPlansMap(sellerIds) {
  if (!sellerIds?.length) return {};
  const ids = [...new Set(sellerIds)].filter(Boolean);
  const { data } = await supabase
    .from('truck_seller_plans')
    .select('seller_id, plan_type, plan_expires')
    .in('seller_id', ids);
  const map = {};
  (data || []).forEach((p) => {
    map[p.seller_id] = p;
  });
  return map;
}

export function enrichTrucksWithSellerPlan(trucks, plansMap) {
  return (trucks || []).map((t) => ({
    ...t,
    sellerIsPro: isProSeller(plansMap[t.seller_id]),
    sellerPlanTier: (plansMap[t.seller_id]?.plan_type) || 'free',
  }));
}
