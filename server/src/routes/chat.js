import express from 'express';
import { streamChat } from '../controllers/chatController.js';
import { validateChatRequest } from '../middleware/validate.js';
import { chatRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /api/chat/stream & POST /api/chat/
const logChatRequest = (req, res, next) => {
  console.log(`[Chat Request] Selected Model received: ${req.body?.model}`);
  next();
};

router.post('/stream', logChatRequest, chatRateLimiter, validateChatRequest, streamChat);
router.post('/', logChatRequest, chatRateLimiter, validateChatRequest, streamChat);

export default router;
