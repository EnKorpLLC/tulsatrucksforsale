import { supabase } from '../../../lib/supabase';
import { getSellerPlansMap, enrichTrucksWithSellerPlan } from '../../../lib/sellerPlan';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date().toISOString();

  const { data: trucksData } = await supabase
    .from('truck_trucks')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!trucksData?.length) {
    return res.json({ ok: true, trucks: [], source: 'none' });
  }

  const sellerIds = [...new Set(trucksData.map((t) => t.seller_id).filter(Boolean))];
  const plansMap = await getSellerPlansMap(sellerIds);
  const { data: sellersData } = sellerIds.length > 0
    ? await supabase.from('truck_sellers').select('id, name, profile_picture_url').in('id', sellerIds)
    : { data: [] };
  const sellersMap = (sellersData || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
  const trucksWithSellers = trucksData.map((t) => ({ ...t, seller: sellersMap[t.seller_id] }));
  const enriched = enrichTrucksWithSellerPlan(trucksWithSellers, plansMap);

  const tierOrder = { dealer: 4, pro_plus: 3, pro: 2, free: 1 };
  const tierRank = (t) => tierOrder[t.sellerPlanTier] || 1;

  const sorted = enriched.sort((a, b) => {
    const aFeatured = a.is_featured && (!a.featured_until || new Date(a.featured_until) > new Date());
    const bFeatured = b.is_featured && (!b.featured_until || new Date(b.featured_until) > new Date());
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    const aTier = tierRank(a);
    const bTier = tierRank(b);
    if (aTier !== bTier) return bTier - aTier;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return res.json({ ok: true, trucks: sorted, source: 'all' });
}
