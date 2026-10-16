import {
  getConversations,
  getConversationById,
  createConversation as dbCreateConversation,
  addMessage as dbAddMessage,
  deleteConversation as dbDeleteConversation
} from '../db/dbService.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export async function listConversations(req, res, next) {
  try {
    const { projectId, limit, userId } = req.query;
    const parsedLimit = limit ? parseInt(limit, 10) : 50;

    const conversations = await getConversations({
      projectId: projectId || null,
      userId: userId || null,
      limit: Number.isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 100)
    });

    res.json({ success: true, data: conversations });
  } catch (err) {
    logger.error('Failed to list conversations', { requestId: req.id, error: err.message });
    next(err);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const conversation = await getConversationById(id, userId || null);

    if (!conversation) {
      return next(new NotFoundError(`Conversation not found with ID: ${id}`));
    }

    res.json({ success: true, data: conversation });
  } catch (err) {
    logger.error('Failed to fetch conversation detail', { requestId: req.id, error: err.message });
    next(err);
  }
}

export async function createConversation(req, res, next) {
  try {
    const { id, title, model_id, modelId, mode, project_id, projectId, user_id, userId } = req.body || {};

    const created = await dbCreateConversation({
      id,
      title: title || 'New Chat',
      model_id: model_id || modelId || 'mahi-engine',
      mode: mode || 'chat',
      project_id: project_id || projectId || null,
      user_id: user_id || userId || null
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    logger.error('Failed to create conversation', { requestId: req.id, error: err.message });
    next(err);
  }
}

export async function addMessageToConversation(req, res, next) {
  try {
    const { id: conversationId } = req.params;
    const { id, role, content, type, metadata } = req.body || {};

    const createdMessage = await dbAddMessage(conversationId, {
      id,
      role: role || 'user',
      content: content || '',
      type: type || 'text',
      metadata: metadata || {}
    });

    res.status(201).json({ success: true, data: createdMessage });
  } catch (err) {
    logger.error('Failed to add message to conversation', { requestId: req.id, conversationId: req.params.id, error: err.message });
    next(err);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const deleted = await dbDeleteConversation(id, userId || null);
    res.json({ success: true, deleted: Boolean(deleted) });
  } catch (err) {
    logger.error('Failed to delete conversation', { requestId: req.id, id: req.params.id, error: err.message });
    next(err);
  }
}

export default {
  listConversations,
  getConversation,
  createConversation,
  addMessageToConversation,
  deleteConversation
};
