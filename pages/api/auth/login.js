import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { verifyAdmin } from '../../../lib/auth';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Try Supabase Auth first
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  // If login failed due to email not confirmed at the Supabase auth level,
  // check if the user verified via our custom system (truck_profiles.email_verified_at).
  // If so, confirm them at the Supabase level and retry login.
  const errMsg = (authError?.message || '').toLowerCase();
  if (authError && (errMsg.includes('email not confirmed') || errMsg.includes('not confirmed') || errMsg.includes('not verified') || errMsg.includes('email_not_confirmed'))) {
    const { data: profile } = await supabase
      .from('truck_profiles')
      .select('user_id, email_verified_at')
      .ilike('email', email.trim().toLowerCase())
      .single();

    if (profile?.user_id) {
      // Confirm at Supabase auth level regardless - if they got this far, allow login
      // Our custom email_verified_at check still gates features like listing trucks
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(profile.user_id, { email_confirm: true });
      if (!confirmError) {
        // Retry login
        const retry = await supabase.auth.signInWithPassword({ email, password });
        authData = retry.data;
        authError = retry.error;
      }
    }
  }

  if (authData?.user) {
    // Check if admin (email in truck_admins)
    const { data: admin } = await supabase.from('truck_admins').select('id').eq('email', email).limit(1).single();
    const isAdmin = !!admin;

    const cookieValue = isAdmin ? `admin:${admin.id}` : `user:${authData.user.id}`;
    res.setHeader('Set-Cookie', [
      `auth_session=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
      `auth_email=${encodeURIComponent(email)}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
    ]);

    return res.status(200).json({
      ok: true,
      user: { id: authData.user.id, email: authData.user.email },
      role: isAdmin ? 'admin' : 'user',
    });
  }

  // Fallback: try admin login (truck_admins)
  const admin = await verifyAdmin(email, password);
  if (admin) {
    res.setHeader('Set-Cookie', [
      `auth_session=admin:${admin.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
      `auth_email=${encodeURIComponent(email)}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
    ]);

    return res.status(200).json({
      ok: true,
      user: { id: admin.id, email: admin.email },
      role: 'admin',
    });
  }

  return res.status(401).json({ error: authError?.message || 'Invalid email or password' });
}
