import { supabase } from '../../../lib/supabase';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'You must be logged in to delete your account' });

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Account deletion is not configured. Contact support.' });
  }

  try {
    const userId = user.id;

    const { data: seller } = await supabase.from('truck_sellers').select('id').eq('user_id', userId).single();

    if (seller) {
      await supabase.from('truck_trucks').delete().eq('seller_id', seller.id);
      await supabase.from('truck_seller_plans').delete().eq('seller_id', seller.id);
      await supabase.from('truck_payments').delete().eq('seller_id', seller.id);
      await supabase.from('truck_sellers').delete().eq('id', seller.id);
    }

    await supabase.from('truck_saved_listings').delete().eq('user_id', userId);
    await supabase.from('truck_profiles').delete().eq('user_id', userId);

    const { data: buyer } = await supabase.from('truck_buyers').select('id').eq('email', user.email).single();
    if (buyer) {
      await supabase.from('truck_financing_requests').update({ buyer_id: null }).eq('buyer_id', buyer.id);
      await supabase.from('truck_buyers').delete().eq('id', buyer.id);
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Auth user delete failed:', authError);
    }

    res.setHeader('Set-Cookie', [
      'auth_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      'auth_email=; Path=/; SameSite=Lax; Max-Age=0',
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
