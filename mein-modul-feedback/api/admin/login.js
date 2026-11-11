import {
  credentialsConfigured,
  credentialsMatch,
  createSessionCookie
} from '../../lib/admin-auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  if (!credentialsConfigured()) {
    return res.status(503).json({ error: 'Admin-Zugang ist nicht konfiguriert.' });
  }

  const { username, password } = req.body || {};
  if (!credentialsMatch(username, password)) {
    return res.status(401).json({ error: 'Benutzername oder Passwort ist falsch.' });
  }

  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ success: true });
}
