import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sellerId } = req.query;

  if (!sellerId) {
    return res.status(400).json({ error: 'sellerId is required' });
  }

  const { data: plan, error } = await supabase
    .from('truck_seller_plans')
    .select('*')
    .eq('seller_id', sellerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" which is fine
    return res.status(500).json({ error: error.message });
  }

  return res.json({ ok: true, plan: plan || null });
}
