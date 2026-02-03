import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'LOGIN_REQUIRED' });
  }

  const { truckId } = req.query;
  if (!truckId) {
    return res.status(400).json({ error: 'truckId is required' });
  }

  // Profile must be complete (user must have seller profile with phone)
  let { data: seller } = await supabase
    .from('truck_sellers')
    .select('id, phone')
    .eq('user_id', user.id)
    .single();
  if (!seller) {
    const { data: byEmail } = await supabase
      .from('truck_sellers')
      .select('id, phone')
      .eq('email', user.email)
      .single();
    seller = byEmail;
  }

  if (!seller?.phone) {
    return res.status(400).json({ error: 'Complete your profile before saving trucks', code: 'PROFILE_INCOMPLETE' });
  }

  if (req.method === 'POST') {
    const { error } = await supabase
      .from('truck_saved_listings')
      .insert({ user_id: user.id, truck_id: truckId });

    if (error && error.code !== '23505') {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ ok: true, saved: true });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('truck_saved_listings')
      .delete()
      .eq('user_id', user.id)
      .eq('truck_id', truckId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ ok: true, saved: false });
  }
}
