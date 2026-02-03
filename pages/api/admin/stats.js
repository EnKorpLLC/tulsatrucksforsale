import { supabase } from '../../../lib/supabase';
import { getAdminFromRequest } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await getAdminFromRequest(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const now = new Date().toISOString();

    // Total trucks listed
    const { count: totalTrucks } = await supabase
      .from('truck_trucks')
      .select('*', { count: 'exact', head: true });

    // Featured trucks active (is_featured = true AND featured_until > now)
    const { count: featuredActive } = await supabase
      .from('truck_trucks')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)
      .or(`featured_until.is.null,featured_until.gte.${now}`);

    // Pro sellers (plan_type = 'pro' AND plan_expires > now)
    const { data: allPlans } = await supabase
      .from('truck_seller_plans')
      .select('*');
    
    const proSellers = (allPlans || []).filter((p) => {
      if (p.plan_type !== 'pro') return false;
      if (!p.plan_expires) return true; // Forever pro
      return new Date(p.plan_expires) > new Date();
    }).length;

    // Total financing requests
    const { count: financingRequests } = await supabase
      .from('truck_financing_requests')
      .select('*', { count: 'exact', head: true });

    // Active ads (is_active = true AND within date range)
    const today = new Date().toISOString().split('T')[0];
    const { count: activeAds } = await supabase
      .from('truck_ads')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`);

    // Revenue totals
    const { data: payments } = await supabase
      .from('truck_payments')
      .select('payment_type, amount');

    const revenue = {
      boost: 0,
      seller_plan: 0,
      ad: 0,
      total: 0,
    };

    (payments || []).forEach((p) => {
      const amount = parseFloat(p.amount) || 0;
      if (p.payment_type === 'boost') revenue.boost += amount;
      else if (p.payment_type === 'seller_plan') revenue.seller_plan += amount;
      else if (p.payment_type === 'ad') revenue.ad += amount;
      revenue.total += amount;
    });

    return res.status(200).json({
      stats: {
        totalTrucks: totalTrucks || 0,
        featuredActive: featuredActive || 0,
        proSellers,
        financingRequests: financingRequests || 0,
        activeAds: activeAds || 0,
      },
      revenue,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
