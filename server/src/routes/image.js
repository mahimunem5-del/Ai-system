import express from 'express';
import { generateImage } from '../controllers/imageController.js';

const router = express.Router();

/**
 * POST /api/generate-image
 * Also mounted at /api/images/generate
 */
router.post('/', generateImage);
router.post('/generate', generateImage);

export default router;
