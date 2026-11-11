import { kv } from '@vercel/kv';
import { isAdminAuthenticated } from '../lib/admin-auth.js';

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
      const { action, modules } = req.body || {};
      if (Array.isArray(modules)) {
        if (!isAdminAuthenticated(req)) {
          return res.status(401).json({ error: 'Admin-Anmeldung erforderlich.' });
        }

        await kv.set(storageKey, modules);
        return res.status(200).json({ success: true, count: modules.length });
      }

      const adminActions = ['updateModule', 'deleteModule', 'updateReview', 'deleteReview'];
      if (adminActions.includes(action) && !isAdminAuthenticated(req)) {
        return res.status(401).json({ error: 'Admin-Anmeldung erforderlich.' });
      }

      const current = await kv.get(storageKey);
      const storedModules = Array.isArray(current) ? current : [];

      if (action === 'createModule') {
        const module = req.body?.module;
        if (!module || typeof module.id !== 'string' || !module.id || module.id.length > 100 ||
            typeof module.name !== 'string' ||
            !module.name.trim() || module.name.length > 200 ||
            typeof module.code !== 'string' || module.code.length > 80 ||
            typeof module.prof !== 'string' || module.prof.length > 200) {
          return res.status(400).json({ error: 'Die Modul-Angaben sind ungültig.' });
        }
        if (storedModules.some(item => item.id === module.id)) {
          return res.status(409).json({ error: 'Dieses Modul existiert bereits.' });
        }

        const newModule = {
          id: module.id,
          name: module.name.trim(),
          code: module.code,
          prof: module.prof,
          reviews: []
        };
        await kv.set(storageKey, [...storedModules, newModule]);
        return res.status(200).json({ success: true, module: newModule });
      }

      if (action === 'addReview') {
        const { moduleId, review } = req.body || {};
        const moduleIndex = storedModules.findIndex(item => item.id === moduleId);
        if (moduleIndex === -1) {
          return res.status(404).json({ error: 'Modul nicht gefunden.' });
        }
        if (!review || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 ||
            !Array.isArray(review.emojis) || review.emojis.length > 24 ||
            review.emojis.some(emoji => typeof emoji !== 'string') ||
            typeof review.comment !== 'string' || review.comment.length > 5000) {
          return res.status(400).json({ error: 'Die Rückmeldung ist ungültig.' });
        }

        const savedReview = {
          rating: review.rating,
          emojis: review.emojis,
          comment: review.comment,
          timestamp: new Date().toISOString()
        };
        storedModules[moduleIndex] = {
          ...storedModules[moduleIndex],
          reviews: [savedReview, ...(Array.isArray(storedModules[moduleIndex].reviews)
            ? storedModules[moduleIndex].reviews
            : [])]
        };
        await kv.set(storageKey, storedModules);
        return res.status(200).json({ success: true, review: savedReview });
      }

      if (action === 'updateModule' || action === 'deleteModule') {
        const { moduleId } = req.body || {};
        const moduleIndex = storedModules.findIndex(item => item.id === moduleId);
        if (moduleIndex === -1) {
          return res.status(404).json({ error: 'Modul nicht gefunden.' });
        }

        if (action === 'deleteModule') {
          storedModules.splice(moduleIndex, 1);
        } else {
          const { name, code, prof } = req.body || {};
          if (typeof name !== 'string' || !name.trim() || name.length > 200 ||
              typeof code !== 'string' || code.length > 80 ||
              typeof prof !== 'string' || prof.length > 200) {
            return res.status(400).json({ error: 'Die Modul-Angaben sind ungültig.' });
          }
          storedModules[moduleIndex] = { ...storedModules[moduleIndex], name: name.trim(), code, prof };
        }

        await kv.set(storageKey, storedModules);
        return res.status(200).json({ success: true });
      }

      if (action === 'updateReview' || action === 'deleteReview') {
        const { moduleId, reviewIndex } = req.body || {};
        const module = storedModules.find(item => item.id === moduleId);
        const reviews = Array.isArray(module?.reviews) ? module.reviews : [];
        if (!module || !Number.isInteger(reviewIndex) || reviewIndex < 0 || reviewIndex >= reviews.length) {
          return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
        }

        if (action === 'deleteReview') {
          reviews.splice(reviewIndex, 1);
        } else {
          const { rating, emojis, comment } = req.body || {};
          if (!Number.isInteger(rating) || rating < 1 || rating > 5 ||
              !Array.isArray(emojis) || emojis.length > 24 ||
              emojis.some(emoji => typeof emoji !== 'string') ||
              typeof comment !== 'string' || comment.length > 5000) {
            return res.status(400).json({ error: 'Die Rückmeldung ist ungültig.' });
          }
          reviews[reviewIndex] = { ...reviews[reviewIndex], rating, emojis, comment };
        }

        module.reviews = reviews;
        await kv.set(storageKey, storedModules);
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Ungültige Speicheraktion.' });
    }

    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  } catch (err) {
    console.error('KV Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
