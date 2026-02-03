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

  const { data: reviews, error } = await supabase
    .from('truck_seller_reviews')
    .select('id, rating, comment, reviewer_name, created_at')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ ok: true, reviews: reviews || [] });
}
