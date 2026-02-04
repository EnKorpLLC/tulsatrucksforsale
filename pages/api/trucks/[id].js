import { supabase } from '../../../lib/supabase';
import { getAuthUserWithProfile } from '../../../lib/getAuthUserWithProfile';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Truck ID required' });

  if (req.method === 'DELETE') {
    const auth = await getAuthUserWithProfile(req);
    if (!auth) return res.status(401).json({ error: 'You must be logged in to delete a truck' });

    const { data: truck } = await supabase.from('truck_trucks').select('id, seller_id').eq('id', id).single();
    if (!truck) return res.status(404).json({ error: 'Truck not found' });

    const { data: seller } = await supabase.from('truck_sellers').select('id, user_id, email').eq('id', truck.seller_id).single();
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    const isOwner = (seller.user_id && seller.user_id === auth.id) || (!seller.user_id && seller.email?.toLowerCase() === auth.email?.toLowerCase());
    if (!isOwner) return res.status(403).json({ error: 'You can only delete your own listings' });

    const { error } = await supabase.from('truck_trucks').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
