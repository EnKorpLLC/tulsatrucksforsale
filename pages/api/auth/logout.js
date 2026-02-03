export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Set-Cookie', [
    'auth_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'auth_email=; Path=/; SameSite=Lax; Max-Age=0',
    'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  ]);

  return res.status(200).json({ ok: true });
}
