import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { getAdminFromRequest } from '../../../lib/adminAuth';
import { generateVerificationToken } from '../../../lib/emailVerification';
import { emailTemplates, sendEmail } from '../../../lib/emailTemplates';

export default async function handler(req, res) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return res.status(401).json({ error: 'Admin access required' });

  // GET - List all users with verification status
  if (req.method === 'GET') {
    const { data: profiles, error } = await supabase
      .from('truck_profiles')
      .select('user_id, email, full_name, role, email_verified_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    return res.status(200).json({ ok: true, users: profiles || [] });
  }

  // PATCH - Manually verify a user's email
  if (req.method === 'PATCH') {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('truck_profiles')
      .update({ email_verified_at: now })
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    // Also confirm at Supabase auth level so login works
    await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

    return res.status(200).json({ ok: true, message: 'User email verified' });
  }

  // POST - Resend verification email to a user
  if (req.method === 'POST') {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const { data: profile } = await supabase
      .from('truck_profiles')
      .select('email, email_verified_at')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (profile.email_verified_at) {
      return res.status(200).json({ ok: true, message: 'User is already verified' });
    }

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await supabase.from('truck_email_verification_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    await sendEmail(profile.email, emailTemplates.emailVerification({ verificationUrl }));

    return res.status(200).json({ ok: true, message: `Verification email sent to ${profile.email}` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
