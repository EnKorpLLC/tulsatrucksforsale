import { supabase } from './supabase';

export async function getAuthUserWithProfile(req) {
  const cookie = req?.headers?.cookie || '';
  const sessionMatch = cookie.match(/auth_session=([^;]+)/);
  const sessionValue = sessionMatch?.[1]?.trim();
  const emailMatch = cookie.match(/auth_email=([^;]+)/);
  const email = emailMatch?.[1] ? decodeURIComponent(emailMatch[1]) : null;

  if (!sessionValue || !email) return null;

  const [type, id] = sessionValue.split(':');
  if (!type || !id) return null;

  if (type === 'admin') {
    const { data } = await supabase.from('truck_admins').select('id, email, name').eq('id', id).single();
    return data ? { ...data, userId: data.id, emailVerified: true, profile: { email_verified_at: new Date().toISOString() } } : null;
  }

  if (type === 'user') {
    const { data } = await supabase.from('truck_profiles').select('*').eq('user_id', id).single();
    if (data) {
      return {
        id: data.user_id,
        email: data.email,
        name: data.full_name,
        emailVerified: !!data.email_verified_at,
        profile: data,
      };
    }
    const { data: byEmail } = await supabase.from('truck_profiles').select('*').eq('email', email).single();
    if (byEmail) {
      return {
        id: byEmail.user_id,
        email: byEmail.email,
        name: byEmail.full_name,
        emailVerified: !!byEmail.email_verified_at,
        profile: byEmail,
      };
    }
  }

  return null;
}
