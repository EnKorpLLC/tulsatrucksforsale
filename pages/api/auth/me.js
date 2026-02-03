import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cookie = req?.headers?.cookie || '';
  const sessionMatch = cookie.match(/auth_session=([^;]+)/);
  const sessionValue = sessionMatch?.[1]?.trim();
  const emailMatch = cookie.match(/auth_email=([^;]+)/);
  const email = emailMatch?.[1] ? decodeURIComponent(emailMatch[1]) : null;

  if (!sessionValue || !email) {
    return res.status(200).json({ user: null });
  }

  const [type, id] = sessionValue.split(':');
  if (!type || !id) return res.status(200).json({ user: null });

  if (type === 'admin') {
    const { data } = await supabase.from('truck_admins').select('id, email, name').eq('id', id).single();
    if (data) {
      return res.status(200).json({
        user: { id: data.id, email: data.email, name: data.name },
        role: 'admin',
      });
    }
  }

  if (type === 'user') {
    const { data } = await supabase.from('truck_profiles').select('*').eq('user_id', id).single();
    if (data) {
      return res.status(200).json({
        user: { id: data.user_id, email: data.email, name: data.full_name },
        role: data.role || 'user',
      });
    }
    // Fallback: use email from cookie if profile exists by email
    const { data: byEmail } = await supabase.from('truck_profiles').select('*').eq('email', email).single();
    if (byEmail) {
      return res.status(200).json({
        user: { id: byEmail.user_id, email: byEmail.email, name: byEmail.full_name },
        role: byEmail.role || 'user',
      });
    }
  }

  return res.status(200).json({ user: null });
}
