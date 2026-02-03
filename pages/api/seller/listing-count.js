import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';
import { getListingLimit } from '../../../lib/sellerPlan';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  let { data: seller } = await supabase
    .from('truck_sellers')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!seller) {
    const { data: byEmail } = await supabase
      .from('truck_sellers')
      .select('id')
      .eq('email', user.email)
      .single();
    seller = byEmail;
  }

  if (!seller) return res.json({ ok: true, count: 0, limit: 1 });

  const { count } = await supabase
    .from('truck_trucks')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', seller.id)
    .eq('status', 'available');

  const { data: plan } = await supabase
    .from('truck_seller_plans')
    .select('plan_type, plan_expires')
    .eq('seller_id', seller.id)
    .single();

  const limit = getListingLimit(plan);

  return res.json({ ok: true, count: count || 0, limit });
}
