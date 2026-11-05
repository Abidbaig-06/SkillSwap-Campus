import { Router } from 'express';
import mongoose from 'mongoose';
import { Photo } from '../models/Photo.js';

const router = Router();

/**
 * GET /api/photos/:id
 * Serves stored custom profile photo directly as binary image stream.
 * Accessible to any authenticated or unauthenticated client (public avatar).
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    const photo = await Photo.findById(id).select('data contentType size');
    if (!photo || !photo.data) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    res.set({
      'Content-Type': photo.contentType,
      'Content-Length': photo.size,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
    });

    return res.end(photo.data);
  } catch (err) {
    console.error('[Photos Router] Error serving photo:', err);
    return res.status(500).json({ error: 'Failed to retrieve photo.' });
  }
});

export default router;

