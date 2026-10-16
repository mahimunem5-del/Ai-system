import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import config from '../config/env.js';
import { ConfigurationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

let supabaseClient = null;

const isSupabaseConfigured = Boolean(
  config.supabase.url &&
  config.supabase.serviceRoleKey &&
  config.supabase.url.startsWith('http') &&
  config.supabase.serviceRoleKey.length > 10
);

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    logger.info('Supabase database client initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize Supabase client', { error: err.message });
    supabaseClient = null;
  }
} else {
  if (config.isProd) {
    logger.warn('[Database Notice]: Running in production without Supabase. Persistent history is disabled.');
  } else {
    logger.debug('Supabase credentials not configured. Development in-memory database store active.');
  }
}

// In-Memory Storage Fallback (Active only for development / test environments)
const inMemoryConversations = new Map();
const inMemoryMessages = new Map(); // conversation_id -> Array<message>

/**
 * Ensures persistence layer is available in production, or falls back in development.
 */
function assertPersistenceAvailable(operationName) {
  if (config.isProd && !supabaseClient) {
    throw new ConfigurationError(`Database operation "${operationName}" cannot persist in production without Supabase configuration.`);
  }
}

/**
 * Fetch all conversations sorted by created_at DESC
 */
export async function getConversations(options = {}) {
  const { projectId = null, limit = 50, userId = null } = options;

  if (supabaseClient) {
    try {
      let query = supabaseClient
        .from('conversations')
        .select('id, title, model_id, mode, project_id, user_id, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data;
      }
      logger.warn('Supabase fetch conversations query returned error', { error: error?.message });
    } catch (e) {
      logger.warn('Supabase query exception during getConversations', { error: e.message });
    }
  }

  assertPersistenceAvailable('getConversations');

  // Fallback to in-memory store for development
  return Array.from(inMemoryConversations.values())
    .filter(c => (!projectId || c.project_id === projectId) && (!userId || c.user_id === userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

/**
 * Fetch a single conversation along with its chronological messages
 */
export async function getConversationById(id, userId = null) {
  if (!id) return null;

  if (supabaseClient) {
    try {
      let query = supabaseClient
        .from('conversations')
        .select('*')
        .eq('id', id);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: conv, error: convErr } = await query.single();

      if (!convErr && conv) {
        const { data: messages, error: msgErr } = await supabaseClient
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });

        return {
          ...conv,
          messages: (!msgErr && Array.isArray(messages)) ? messages : []
        };
      }
      logger.warn('Supabase conversation fetch error', { id, error: convErr?.message });
    } catch (e) {
      logger.warn('Supabase conversation query exception', { id, error: e.message });
    }
  }

  assertPersistenceAvailable('getConversationById');

  // Fallback to in-memory store for development
  const conv = inMemoryConversations.get(id);
  if (!conv) return null;
  if (userId && conv.user_id && conv.user_id !== userId) return null;

  const msgs = (inMemoryMessages.get(id) || [])
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return {
    ...conv,
    messages: msgs
  };
}

/**
 * Create a new conversation thread
 */
export async function createConversation(data = {}) {
  const id = data.id || crypto.randomUUID();
  const newConv = {
    id,
    title: data.title || 'New Chat',
    model_id: data.model_id || data.modelId || 'mahi-engine',
    mode: data.mode || 'chat',
    project_id: data.project_id || data.projectId || null,
    user_id: data.user_id || data.userId || null,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabaseClient) {
    try {
      const { data: created, error } = await supabaseClient
        .from('conversations')
        .insert([newConv])
        .select()
        .single();

      if (!error && created) {
        return created;
      }
      logger.warn('Supabase insert conversation failed', { error: error?.message });
    } catch (e) {
      logger.warn('Supabase insert conversation exception', { error: e.message });
    }
  }

  assertPersistenceAvailable('createConversation');

  inMemoryConversations.set(id, newConv);
  if (!inMemoryMessages.has(id)) {
    inMemoryMessages.set(id, []);
  }
  return newConv;
}

/**
 * Persist a message record
 */
export async function addMessage(conversationId, data = {}) {
  if (!conversationId) throw new Error('conversation_id is required');

  const id = data.id || crypto.randomUUID();
  const newMsg = {
    id,
    conversation_id: conversationId,
    role: data.role || 'user',
    content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content || ''),
    type: data.type || 'text',
    metadata: data.metadata || {},
    created_at: data.created_at || new Date().toISOString()
  };

  if (supabaseClient) {
    try {
      const { data: created, error } = await supabaseClient
        .from('messages')
        .insert([newMsg])
        .select()
        .single();

      if (!error && created) {
        await supabaseClient
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        return created;
      }
      logger.warn('Supabase message insert failed', { error: error?.message });
    } catch (e) {
      logger.warn('Supabase message insert exception', { error: e.message });
    }
  }

  assertPersistenceAvailable('addMessage');

  // In-memory fallback
  if (!inMemoryMessages.has(conversationId)) {
    inMemoryMessages.set(conversationId, []);
  }
  inMemoryMessages.get(conversationId).push(newMsg);

  const conv = inMemoryConversations.get(conversationId);
  if (conv) {
    conv.updated_at = new Date().toISOString();
  }

  return newMsg;
}

/**
 * Delete a conversation and cascade all its messages
 */
export async function deleteConversation(id, userId = null) {
  if (!id) return false;

  if (supabaseClient) {
    try {
      let query = supabaseClient
        .from('conversations')
        .delete()
        .eq('id', id);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;
      if (!error) return true;
      logger.warn('Supabase delete error', { id, error: error?.message });
    } catch (e) {
      logger.warn('Supabase delete exception', { id, error: e.message });
    }
  }

  assertPersistenceAvailable('deleteConversation');

  inMemoryConversations.delete(id);
  inMemoryMessages.delete(id);
  return true;
}

/**
 * Health check status of the database connection
 */
export async function checkDatabaseHealth() {
  if (!supabaseClient) {
    return {
      status: config.isProd ? 'unconfigured' : 'memory_fallback',
      type: 'in_memory',
      connected: !config.isProd
    };
  }

  try {
    const { error } = await supabaseClient.from('conversations').select('id').limit(1);
    if (!error) {
      return { status: 'connected', type: 'supabase', connected: true };
    }
    return { status: 'error', type: 'supabase', error: error.message, connected: false };
  } catch (err) {
    return { status: 'exception', type: 'supabase', error: err.message, connected: false };
  }
}

export default {
  getConversations,
  getConversationById,
  createConversation,
  addMessage,
  deleteConversation,
  checkDatabaseHealth
};
