import { clearSessionCookie } from '../../lib/admin-auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(200).json({ success: true });
}
