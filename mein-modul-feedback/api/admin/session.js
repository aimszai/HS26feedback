import { isAdminAuthenticated } from '../../lib/admin-auth.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  return res.status(200).json({ authenticated: isAdminAuthenticated(req) });
}
