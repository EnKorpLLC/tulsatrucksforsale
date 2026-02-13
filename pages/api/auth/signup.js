import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { generateVerificationToken } from '../../../lib/emailVerification';
import { emailTemplates, sendEmail } from '../../../lib/emailTemplates';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const emailLower = email.trim().toLowerCase();
  const { data: existing } = await supabase
    .from('truck_profiles')
    .select('id')
    .ilike('email', emailLower)
    .limit(1);
  if (existing?.length) {
    return res.status(400).json({ error: 'An account with this email already exists. Sign in or use a different email.' });
  }

  // Use admin API to create user with email_confirm: true
  // This prevents Supabase from sending its own verification email from supabase.io
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email: emailLower,
    password,
    email_confirm: true,
    user_metadata: { full_name: name || '' },
  });

  if (error) {
    const msg = error.message?.toLowerCase().includes('already') ? 'An account with this email already exists. Sign in or use a different email.' : error.message;
    return res.status(400).json({ error: msg });
  }

  const user = authData?.user;
  if (user) {
    await supabase.from('truck_profiles').upsert({
      user_id: user.id,
      email: user.email,
      full_name: name || user.user_metadata?.full_name || null,
      role: 'user',
    }, { onConflict: 'user_id' });

    res.setHeader('Set-Cookie', [
      `auth_session=user:${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
      `auth_email=${encodeURIComponent(email)}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
    ]);

    // Auto-send custom verification email via Resend (from tulsatrucksforsale.com)
    try {
      const token = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await supabase.from('truck_email_verification_tokens').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

      await sendEmail(user.email, emailTemplates.emailVerification({ verificationUrl }));
    } catch (emailErr) {
      console.error('Failed to send verification email on signup:', emailErr);
      // Don't block signup if email fails - user can request again from /verify-email
    }
  }

  return res.status(200).json({
    ok: true,
    user: { id: user.id, email: user.email },
  });
}
