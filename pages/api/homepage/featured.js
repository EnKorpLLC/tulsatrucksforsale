import { supabase } from '../../../lib/supabase';
import { getSellerPlansMap, enrichTrucksWithSellerPlan } from '../../../lib/sellerPlan';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date().toISOString();

  // 1. Try featured/boosted trucks first
  const { data: featuredData } = await supabase
    .from('truck_trucks')
    .select('*')
    .eq('status', 'available')
    .eq('is_featured', true)
    .or(`featured_until.is.null,featured_until.gte.${now}`)
    .order('created_at', { ascending: false })
    .limit(6);

  if (featuredData?.length > 0) {
    const sellerIds = featuredData.map((t) => t.seller_id).filter(Boolean);
    const plansMap = await getSellerPlansMap(sellerIds);
    const { data: sellersData } = sellerIds.length > 0
      ? await supabase.from('truck_sellers').select('id, name, profile_picture_url').in('id', sellerIds)
      : { data: [] };
    const sellersMap = (sellersData || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
    const trucksWithSellers = featuredData.map((t) => ({ ...t, seller: sellersMap[t.seller_id] }));
    const enriched = enrichTrucksWithSellerPlan(trucksWithSellers, plansMap);
    return res.json({ ok: true, trucks: enriched, source: 'featured' });
  }

  // 2. Fallback: one truck each from top 10 most-reviewed sellers
  const { data: reviews } = await supabase
    .from('truck_seller_reviews')
    .select('seller_id');

  const countBySeller = {};
  (reviews || []).forEach((r) => {
    if (r.seller_id) {
      countBySeller[r.seller_id] = (countBySeller[r.seller_id] || 0) + 1;
    }
  });

  const topSellerIds = Object.entries(countBySeller)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  let trucks = [];
  let source = 'top_reviewed';

  if (topSellerIds.length >= 1) {
    for (const sellerId of topSellerIds) {
      const { data: truck } = await supabase
        .from('truck_trucks')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (truck) trucks.push(truck);
    }
  }

  // 3. Fallback: if no/few reviewed sellers, use oldest sellers with available trucks
  if (trucks.length < 10) {
    const alreadyUsed = new Set(trucks.map((t) => t.seller_id));
    const { data: availableTrucks } = await supabase
      .from('truck_trucks')
      .select('seller_id')
      .eq('status', 'available')
      .not('seller_id', 'is', null);

    const sellerIdsWithStock = [...new Set((availableTrucks || []).map((t) => t.seller_id).filter(Boolean))];
    const candidateIds = sellerIdsWithStock.filter((id) => !alreadyUsed.has(id));

    const { data: sellers } = candidateIds.length > 0
      ? await supabase
          .from('truck_sellers')
          .select('id')
          .in('id', candidateIds)
          .order('created_at', { ascending: true })
          .limit(10 - trucks.length)
      : { data: [] };

    const oldestSellerIds = (sellers || []).map((s) => s.id);

    for (const sellerId of oldestSellerIds) {
      const { data: truck } = await supabase
        .from('truck_trucks')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (truck) trucks.push(truck);
    }
    if (topSellerIds.length < 1) {
      source = 'oldest_sellers';
    } else {
      source = 'mixed';
    }
  }

  if (trucks.length === 0) {
    return res.json({ ok: true, trucks: [], source: 'none' });
  }

  const sellerIds = trucks.map((t) => t.seller_id).filter(Boolean);
  const plansMap = await getSellerPlansMap(sellerIds);
  const { data: sellersData } = sellerIds.length > 0
    ? await supabase.from('truck_sellers').select('id, name, profile_picture_url').in('id', sellerIds)
    : { data: [] };
  const sellersMap = (sellersData || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
  const trucksWithSellers = trucks.map((t) => ({ ...t, seller: sellersMap[t.seller_id] }));
  const enriched = enrichTrucksWithSellerPlan(trucksWithSellers, plansMap);

  return res.json({ ok: true, trucks: enriched, source });
}
