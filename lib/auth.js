import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

const MASTER_ADMIN_EMAIL = 'team@enkorpllc.com';
const MASTER_ADMIN_PASSWORD = 'Qwas!@90';

export async function verifyAdmin(email, password) {
  const { data: admins } = await supabase
    .from('truck_admins')
    .select('*')
    .eq('email', email)
    .limit(1);

  if (admins && admins.length > 0) {
    const valid = await bcrypt.compare(password, admins[0].password_hash);
    if (valid) return admins[0];
  }

  if (email === MASTER_ADMIN_EMAIL && password === MASTER_ADMIN_PASSWORD) {
    const { data: existing } = await supabase.from('truck_admins').select('id').eq('email', email).limit(1);
    if (!existing?.length) {
      const hash = await bcrypt.hash(MASTER_ADMIN_PASSWORD, 10);
      const { data: inserted } = await supabase.from('truck_admins').insert({
        email: MASTER_ADMIN_EMAIL,
        password_hash: hash,
        name: 'Master Admin',
      }).select().single();
      if (inserted) return inserted;
    }
  }
  return null;
}
