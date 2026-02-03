import { getAdminFromRequest } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  const admin = await getAdminFromRequest(req);
  return res.status(200).json({ admin: admin ? { id: admin.id, email: admin.email } : null });
}
