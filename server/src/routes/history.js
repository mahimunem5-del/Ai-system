import express from 'express';
import {
  listConversations,
  getConversation,
  createConversation,
  addMessageToConversation,
  deleteConversation
} from '../controllers/historyController.js';
import {
  validateHistoryId,
  validateCreateConversation,
  validateAddMessage
} from '../middleware/validate.js';
import { generalRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.use(generalRateLimiter);

router.get('/conversations', listConversations);
router.get('/conversations/:id', validateHistoryId, getConversation);
router.post('/conversations', validateCreateConversation, createConversation);
router.post('/conversations/:id/messages', validateHistoryId, validateAddMessage, addMessageToConversation);
router.delete('/conversations/:id', validateHistoryId, deleteConversation);

export default router;
