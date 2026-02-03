import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';

export default async function handler(req, res) {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('truck_saved_listings')
      .select('truck_id')
      .eq('user_id', user.id);

    const truckIds = (data || []).map((r) => r.truck_id);
    return res.json({ ok: true, truckIds });
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}
