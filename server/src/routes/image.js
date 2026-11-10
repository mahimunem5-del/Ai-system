import express from 'express';
import { generateImage, executePreciseEdit, executeUpscaleImage, executeVectorizeImage, executeVectorIllustration } from '../controllers/imageController.js';

const router = express.Router();

/**
 * POST /api/generate-image
 * Also mounted at /api/images/generate
 */
router.post('/', generateImage);
router.post('/generate', generateImage);
router.post('/precise-edit', executePreciseEdit);
router.post('/edit', executePreciseEdit);
router.post('/smart-edit', executePreciseEdit);
router.post('/upscale', executeUpscaleImage);
router.post('/vectorize', executeVectorizeImage);
router.post('/vector-illustration', executeVectorIllustration);
router.post('/illustration', executeVectorIllustration);

export default router;
