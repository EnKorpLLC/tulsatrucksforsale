import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';
import { emailTemplates, sendEmail } from '../../../lib/emailTemplates';
import { generateVerificationToken } from '../../../lib/emailVerification';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not logged in' });

  const { data: profile } = await supabase
    .from('truck_profiles')
    .select('email_verified_at')
    .eq('user_id', user.id)
    .single();

  if (profile?.email_verified_at) {
    return res.status(200).json({ ok: true, message: 'Email already verified' });
  }

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

  return res.status(200).json({ ok: true, message: 'Verification email sent' });
}
