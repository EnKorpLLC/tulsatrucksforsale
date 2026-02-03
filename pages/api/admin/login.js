import { verifyAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const admin = await verifyAdmin(email, password);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  res.setHeader('Set-Cookie', `admin_session=${admin.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
  return res.status(200).json({ ok: true });
}
