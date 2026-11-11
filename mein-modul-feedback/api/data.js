import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storageKey = 'modules_data';

  try {
    if (req.method === 'GET') {
      const data = await kv.get(storageKey);
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const modules = req.body?.modules;
      if (!Array.isArray(modules)) {
        return res.status(400).json({ error: 'Array "modules" erforderlich' });
      }

      await kv.set(storageKey, modules);
      return res.status(200).json({ success: true, count: modules.length });
    }

    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  } catch (err) {
    console.error('KV Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
