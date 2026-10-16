import express from 'express';
import { streamCompare } from '../controllers/compareController.js';
import { validateCompareRequest } from '../middleware/validate.js';
import { chatRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /api/chat/compare
router.post('/compare', chatRateLimiter, validateCompareRequest, streamCompare);

export default router;
