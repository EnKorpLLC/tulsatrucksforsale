import crypto from 'crypto';

export const SKIP_EMAIL_VERIFICATION = process.env.SKIP_EMAIL_VERIFICATION === 'true' || process.env.SKIP_EMAIL_VERIFICATION === '1';

export function isEmailVerified(profile) {
  return !!(profile?.email_verified_at);
}

export function requiresEmailVerification(profile) {
  if (SKIP_EMAIL_VERIFICATION) return false;
  return !isEmailVerified(profile);
}

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}
