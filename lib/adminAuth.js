import { supabase } from './supabase';

export async function getAdminFromRequest(req) {
  const cookie = req?.headers?.cookie || '';

  // New unified auth: auth_session=admin:uuid
  const authMatch = cookie.match(/auth_session=admin:([^;]+)/);
  if (authMatch) {
    const { data } = await supabase.from('truck_admins').select('*').eq('id', authMatch[1].trim()).single();
    return data;
  }

  // Legacy: admin_session=uuid
  const legacyMatch = cookie.match(/admin_session=([^;]+)/);
  if (legacyMatch) {
    const { data } = await supabase.from('truck_admins').select('*').eq('id', legacyMatch[1].trim()).single();
    return data;
  }

  return null;
}
