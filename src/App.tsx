import React, { useEffect, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SourceItem {
  title: string;
  url: string;
}

export interface ImageItem {
  imageUrl: string;
  prompt: string;
}

export async function* streamChatResponse(
  messages: ChatMessage[],
  model: string = 'mahi-engine',
  searchMode: 'none' | 'web-search' | 'deep-research' = 'none',
  signal?: AbortSignal,
  onStatus?: (status: string) => void,
  onSources?: (sources: SourceItem[]) => void,
  onImage?: (image: ImageItem) => void,
  onImageError?: (error: string) => void
): AsyncGenerator<string, void, unknown> {
  const response = await fetch('http://localhost:5001/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, model, searchMode }),
    signal
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') return;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed) {
          if (parsed.type === 'status' && onStatus) {
            onStatus(parsed.message);
          } else if (parsed.type === 'sources' && onSources) {
            onSources(parsed.data || []);
          } else if (parsed.type === 'image' && onImage) {
            onImage({ imageUrl: parsed.imageUrl, prompt: parsed.prompt });
          } else if ((parsed.type === 'image_error' || parsed.type === 'error') && onImageError) {
            onImageError(parsed.error || parsed.message || 'Unable to generate image');
          } else if (typeof parsed.text === 'string') {
            yield parsed.text;
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }
}

export async function streamCompareResponses(
  messages: ChatMessage[],
  models: string[] = ['mahi-engine', 'gpt-4o-mini'],
  callbacks: {
    onChunk?: (modelId: string, text: string) => void;
    onModelDone?: (modelId: string) => void;
    onModelError?: (modelId: string, error: string) => void;
    onAllDone?: () => void;
  },
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('http://localhost:5001/api/chat/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, models }),
    signal
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') {
        callbacks.onAllDone?.();
        return;
      }
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === 'model_done' && parsed.modelId) {
          callbacks.onModelDone?.(parsed.modelId);
        } else if (parsed.type === 'model_error' && parsed.modelId) {
          callbacks.onModelError?.(parsed.modelId, parsed.error);
        } else if (parsed.modelId && typeof parsed.text === 'string') {
          callbacks.onChunk?.(parsed.modelId, parsed.text);
        }
      } catch {
        // ignore parse error
      }
    }
  }

  callbacks.onAllDone?.();
}

export async function fetchConversations(projectId?: string): Promise<any[]> {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  const res = await fetch(`http://localhost:5001/api/history/conversations${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchConversationDetail(id: string): Promise<any> {
  const res = await fetch(`http://localhost:5001/api/history/conversations/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function deleteConversationApi(id: string): Promise<boolean> {
  const res = await fetch(`http://localhost:5001/api/history/conversations/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) return false;
  const json = await res.json();
  return Boolean(json.deleted);
}

export const App: React.FC = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status === 'ok') {
          console.log('[Backend Core]: Connected to Mestrio Engine API');
        }
      })
      .catch(() => {});

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return null;
};

export default App;
