import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query || {};
  if (!token) return res.status(400).json({ ok: false, error: 'Missing token' });

  const now = new Date().toISOString();

  const { data: row } = await supabase
    .from('truck_email_verification_tokens')
    .select('user_id')
    .eq('token', token)
    .gt('expires_at', now)
    .limit(1)
    .single();

  if (!row) {
    return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
  }

  await supabase
    .from('truck_profiles')
    .update({ email_verified_at: now })
    .eq('user_id', row.user_id);

  await supabase
    .from('truck_email_verification_tokens')
    .delete()
    .eq('token', token);

  return res.status(200).json({ ok: true });
}
