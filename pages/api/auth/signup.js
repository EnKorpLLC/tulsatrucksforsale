import { supabase } from '../../../lib/supabase';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name || '' }, emailRedirectTo: undefined },
  });

  if (error) return res.status(400).json({ error: error.message });

  if (authData?.user) {
    await supabase.from('truck_profiles').upsert({
      user_id: authData.user.id,
      email: authData.user.email,
      full_name: name || authData.user.user_metadata?.full_name || null,
      role: 'user',
    }, { onConflict: 'user_id' });

    res.setHeader('Set-Cookie', [
      `auth_session=user:${authData.user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
      `auth_email=${encodeURIComponent(email)}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
    ]);
  }

  return res.status(200).json({
    ok: true,
    user: { id: authData.user.id, email: authData.user.email },
  });
}
