import http from 'http';
import { createStreamWithResilience } from '../providers/openrouterProvider.js';
import { resolveModel } from './modelRouter.js';
import { IMAGE_GENERATION_TOOL, executeImageGeneration } from './imageService.js';
import logger from '../utils/logger.js';

// Global response registry mapped by requestId for direct SSE event delivery
const responseRegistry = new Map();

const origSetHeader = http.ServerResponse.prototype.setHeader;
http.ServerResponse.prototype.setHeader = function (name, value) {
  if (typeof name === 'string' && name.toLowerCase() === 'x-request-id' && typeof value === 'string') {
    responseRegistry.set(value, this);
    this.once('finish', () => responseRegistry.delete(value));
    this.once('close', () => responseRegistry.delete(value));
  }
  return origSetHeader.apply(this, arguments);
};

export function resolveWriteChunk(requestId, writeChunkParam) {
  if (typeof writeChunkParam === 'function') {
    return writeChunkParam;
  }
  if (requestId && responseRegistry.has(requestId)) {
    const res = responseRegistry.get(requestId);
    return (payload) => {
      if (res.writableEnded || res.destroyed) return;
      if (payload === '[DONE]') {
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
  }
  return null;
}

export const SYSTEM_BEHAVIOR_AND_FORMATTING_INSTRUCTIONS = `
CRITICAL BEHAVIOR & INTENT AWARENESS:
1. Autonomous Creative Capabilities: You are equipped with autonomous creative tools. You NEVER say 'I am a text-based model and cannot generate images' or 'I cannot create files'.
2. MULTI-TURN CONTEXT: If the user refers back to a previous topic or prompt (e.g. 'Tmi banai daw', 'make it now', 'yeh image bana do', 'generate this', 'chobi ta toiri koro'), identify the subject from the conversation history and immediately trigger the \`generate_image\` tool with a rich, detailed English visual prompt based on that context.
3. LANGUAGE INDEPENDENCE: Understand requests in any language or dialect (Bangla, Banglish, Hindi, English, Spanish, conversational slang, etc.) natively and automatically.

CRITICAL FOR IMAGES:
When the user asks to generate, create, draw, or make an image, DO NOT write or print JSON code blocks like \`\`\`image { prompt: ... } \`\`\` or \`\`\`json { "prompt": ... } \`\`\`.
You MUST invoke the native function tool call \`generate_image(prompt: '...')\`. Any textual JSON representation is strictly forbidden.
CRITICAL: You are strictly forbidden from writing textual promises like '(Generating your cat image...)' or 'Wait a moment, creating image'. If you respond with text instead of invoking the tool or letting the orchestrator generate it, it is a fatal failure.

ON-DEMAND FILE & ARTIFACT PROTOCOL:
Files are ONLY created when the user explicitly requests one in ANY language (e.g., 'ekta pdf banao', 'make a presentation slide', 'create a word doc', 'is topic par slides ready karo', 'export as pdf'):
- When asked to generate a downloadable PDF, Document, or Slides, output an artifact code block:
\`\`\`file:pdf
filename: Document_Name.pdf
title: Document Title
content: ... (formatted content)
\`\`\`
or \`\`\`file:slide (for slides), or \`\`\`file:docx (for word docs).
In normal messages where no file was requested, do NOT output file artifact blocks.

MARKDOWN & OUTPUT FORMATTING GUIDELINES:
- Code & Configurations: Always enclose all code snippets, scripts, configurations, and copyable prompt templates in triple-backtick markdown blocks with explicit language identifiers (e.g., \`\`\`html, \`\`\`python, \`\`\`javascript, \`\`\`css, \`\`\`json, \`\`\`prompt, \`\`\`text). Never provide unformatted code or raw prompt templates.
- Presentations & Slides: When the user requests a presentation, pitch deck, or slides, format each individual slide starting with a markdown header (## Slide Title) separated cleanly with horizontal rules (---). Ensure slide content is punchy, high-impact, and well-structured.
`.trim();

export const MARKDOWN_FORMATTING_GUIDELINES = SYSTEM_BEHAVIOR_AND_FORMATTING_INSTRUCTIONS;

function getMessageLength(msg) {
  if (!msg || !msg.content) return 0;
  if (typeof msg.content === 'string') return msg.content.length;
  if (Array.isArray(msg.content)) {
    return msg.content.reduce((acc, part) => {
      if (part?.type === 'text') return acc + (part.text || '').length;
      if (part?.type === 'image_url') return acc + 1000;
      return acc + 100;
    }, 0);
  }
  return 100;
}

/**
 * Trims message history if it exceeds reasonable context limits to control token costs
 */
function trimHistoryForCostControl(messages, maxTokensApprox = 40000) {
  if (!Array.isArray(messages) || messages.length <= 1) return messages;

  let totalChars = 0;
  const maxChars = maxTokensApprox * 4;
  const trimmed = [];

  // Always retain the initial system message if present
  let firstSystem = null;
  if (messages[0]?.role === 'system') {
    firstSystem = messages[0];
    totalChars += getMessageLength(firstSystem);
  }

  // Work backwards from the most recent messages
  const pool = firstSystem ? messages.slice(1) : messages;
  for (let i = pool.length - 1; i >= 0; i--) {
    const msg = pool[i];
    const len = getMessageLength(msg);
    if (totalChars + len > maxChars && trimmed.length >= 2) {
      break;
    }
    totalChars += len;
    trimmed.unshift(msg);
  }

  return firstSystem ? [firstSystem, ...trimmed] : trimmed;
}

/**
 * Detects whether accumulated text contains a pseudo-tool JSON image block
 */
export function isImageJsonBlock(text) {
  if (!text || typeof text !== 'string') return false;
  const hasImageOrJsonFence = /(?:```image|```json|\{\s*"prompt")/i.test(text);
  const hasPromptKey = /["']prompt["']\s*:/i.test(text);
  return hasImageOrJsonFence && hasPromptKey;
}

/**
 * Parses the prompt string from an image markdown / JSON code block
 */
export function parseImagePromptFromJsonBlock(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Matches ```image ... ``` or ```json ... ``` or ``` ... ```
  const blockMatch = text.match(/```(?:image|json)?\s*([\s\S]*?)(?:```|$)/i);
  const blockContent = blockMatch ? blockMatch[1].trim() : text.trim();

  try {
    const jsonMatch = blockContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed.prompt === 'string' && parsed.prompt.trim()) {
        return parsed.prompt.trim();
      }
    }
  } catch (_) { }

  // 2. Direct regex extraction of "prompt": "..."
  const promptMatch = text.match(/"prompt"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
  if (promptMatch && promptMatch[1]) {
    try {
      return JSON.parse(`"${promptMatch[1]}"`).trim();
    } catch (_) {
      return promptMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
    }
  }

  // 3. Single quote fallback
  const singleMatch = text.match(/'prompt'\s*:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/i);
  if (singleMatch && singleMatch[1]) {
    return singleMatch[1].replace(/\\'/g, "'").trim();
  }

  return null;
}

/**
 * Iterates through raw provider stream, intercepting LLM tool calls for FLUX.1 Schnell
 * image generation and directly dispatching SSE status and image events.
 * Also includes a streaming failsafe for models printing raw JSON code blocks.
 */
async function* processStreamWithTools(rawStream, { writeChunk, abortSignal, requestId }) {
  let isToolCall = false;
  let toolCallArguments = '';
  let statusSent = false;
  let accumulatedText = '';
  let isImageGenerated = false;

  // Buffer initial chunks to intercept pseudo-tool code blocks (e.g. ```image or ```json)
  let chunkBuffer = [];
  let isCheckingForImageJson = true;
  const MAX_BUFFER_CHARS = 350;

  for await (const chunk of rawStream) {
    if (abortSignal?.aborted) break;

    const delta = chunk.choices?.[0]?.delta;
    const toolCalls = delta?.tool_calls;

    // A. Native Tool Calling Handling
    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      isToolCall = true;
      for (const tc of toolCalls) {
        if (tc.function?.arguments) {
          toolCallArguments += tc.function.arguments;
        }
      }

      if (!statusSent) {
        statusSent = true;
        if (typeof writeChunk === 'function') {
          writeChunk({ type: 'status', message: 'Generating image...' });
        }
      }
      // Do NOT stream raw JSON tokens as text to the client
      continue;
    }

    if (isToolCall) {
      continue;
    }

    // B. Plain text streaming with Failsafe Catch-all for JSON Code Blocks
    const content = delta?.content || '';
    if (content) {
      accumulatedText += content;

      if (isCheckingForImageJson) {
        chunkBuffer.push(chunk);

        // Check if accumulated text looks like it might be an image JSON block
        const trimmed = accumulatedText.trim();
        const mightBeImageJson = trimmed.startsWith('```image') ||
          trimmed.startsWith('```json') ||
          trimmed.startsWith('```') ||
          trimmed.startsWith('{') ||
          /^(?:sure|here|i\s+have|i\s+will|generating)/i.test(trimmed);

        if (isImageJsonBlock(accumulatedText)) {
          const prompt = parseImagePromptFromJsonBlock(accumulatedText);
          if (prompt) {
            isImageGenerated = true;
            isCheckingForImageJson = false;
            chunkBuffer = []; // Suppress raw JSON from reaching client!

            if (typeof writeChunk === 'function') {
              writeChunk({ type: 'status', message: 'Generating image...' });
            }

            try {
              const result = await executeImageGeneration({
                prompt,
                abortSignal,
                requestId
              });

              if (typeof writeChunk === 'function') {
                writeChunk({
                  type: 'image',
                  imageUrl: result.imageUrl,
                  prompt: result.prompt || prompt
                });
                writeChunk('[DONE]');
              }
            } catch (err) {
              logger.error('Error executing image generation from JSON code block failsafe', { requestId, error: err.message });
              if (typeof writeChunk === 'function') {
                writeChunk({
                  type: 'image_error',
                  message: 'Unable to generate image, please try again',
                  error: err.message || 'Failed to synthesize visual asset'
                });
                writeChunk('[DONE]');
              }
            }
            break;
          }
        }

        // If buffer exceeded limit or clearly not an image block, flush buffer
        if (accumulatedText.length > MAX_BUFFER_CHARS || (!mightBeImageJson && accumulatedText.length > 35)) {
          isCheckingForImageJson = false;
          for (const bufferedChunk of chunkBuffer) {
            yield bufferedChunk;
          }
          chunkBuffer = [];
        }
      } else {
        yield chunk;
      }
    }
  }

  // Handle stream end while buffer was still active
  if (isCheckingForImageJson && !isImageGenerated) {
    if (isImageJsonBlock(accumulatedText)) {
      const prompt = parseImagePromptFromJsonBlock(accumulatedText);
      if (prompt) {
        isImageGenerated = true;
        chunkBuffer = []; // Suppress raw JSON

        if (typeof writeChunk === 'function') {
          writeChunk({ type: 'status', message: 'Generating image...' });
        }

        try {
          const result = await executeImageGeneration({
            prompt,
            abortSignal,
            requestId
          });

          if (typeof writeChunk === 'function') {
            writeChunk({
              type: 'image',
              imageUrl: result.imageUrl,
              prompt: result.prompt || prompt
            });
            writeChunk('[DONE]');
          }
        } catch (err) {
          logger.error('Error in stream-end image generation failsafe', { requestId, error: err.message });
          if (typeof writeChunk === 'function') {
            writeChunk({
              type: 'image_error',
              message: 'Unable to generate image, please try again',
              error: err.message || 'Failed to synthesize visual asset'
            });
            writeChunk('[DONE]');
          }
        }
        return;
      }
    }

    // Not an image JSON block: flush all buffered chunks to client
    for (const bufferedChunk of chunkBuffer) {
      yield bufferedChunk;
    }
    chunkBuffer = [];
  }

  // Handle completed native tool call if invoked
  if (isToolCall && !isImageGenerated) {
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolCallArguments);
      } catch (_) {
        const match = toolCallArguments.match(/"prompt"\s*:\s*"([^"]+)"/);
        if (match) {
          parsedArgs = { prompt: match[1] };
        } else {
          parsedArgs = { prompt: toolCallArguments.trim() };
        }
      }

      const promptToGenerate = (parsedArgs && parsedArgs.prompt) ? parsedArgs.prompt : toolCallArguments.trim();

      const result = await executeImageGeneration({
        prompt: promptToGenerate,
        abortSignal,
        requestId
      });

      if (typeof writeChunk === 'function') {
        writeChunk({
          type: 'image',
          imageUrl: result.imageUrl,
          prompt: result.prompt || promptToGenerate
        });
        writeChunk('[DONE]');
      }
    } catch (err) {
      logger.error('Error executing image generation from OpenRouter tool call', { requestId, error: err.message });
      if (typeof writeChunk === 'function') {
        writeChunk({
          type: 'image_error',
          message: 'Unable to generate image, please try again',
          error: err.message || 'Failed to synthesize visual asset'
        });
        writeChunk('[DONE]');
      }
    }
  }
}

/**
 * Formats messages into clean OpenAI-compatible schema and initiates resilient stream
 */
export async function createCompletionStream({
  model,
  messages = [],
  systemInstruction = null,
  projectId = null,
  projectInstructions = null,
  abortSignal = null,
  requestId = '-',
  writeChunk: customWriteChunk = null
}) {
  const resolved = resolveModel(model);
  const formattedMessages = [];

  // 1. Inject isolated project workspace instructions if active
  if (projectInstructions) {
    formattedMessages.push({
      role: 'system',
      content: `PROJECT WORKSPACE INSTRUCTIONS:\nYou are operating within an isolated workspace (Project ID: ${projectId || 'default'}). Adhere strictly to the following instructions:\n${projectInstructions}`
    });
  } else if (projectId) {
    formattedMessages.push({
      role: 'system',
      content: `PROJECT WORKSPACE CONTEXT:\nYou are operating within an isolated workspace for Project ID: ${projectId}. Keep all analysis and code aligned with this project.`
    });
  }

  // 2. Dynamic system prompt (Mahi Engine persona or Research grounding) + formatting guidelines
  if (systemInstruction) {
    formattedMessages.push({
      role: 'system',
      content: `${systemInstruction}\n\n${MARKDOWN_FORMATTING_GUIDELINES}`
    });
  } else {
    formattedMessages.push({
      role: 'system',
      content: MARKDOWN_FORMATTING_GUIDELINES
    });
  }

  // 3. User & Assistant conversational messages
  if (Array.isArray(messages) && messages.length > 0) {
    messages.forEach(m => {
      if (!m) return;
      let contentPayload = m.content;
      if (m.role === 'assistant' && (!contentPayload || (typeof contentPayload === 'string' && !contentPayload.trim()))) {
        contentPayload = m.imageUrl ? (m.imagePrompt ? `[Generated Image: ${m.imagePrompt}]` : '[Generated Image]') : '[Assistant Response]';
      }
      if (!contentPayload || (typeof contentPayload === 'string' && !contentPayload.trim())) {
        return;
      }

      if (typeof contentPayload !== 'string' && !Array.isArray(contentPayload)) {
        contentPayload = JSON.stringify(contentPayload);
      }

      formattedMessages.push({
        role: m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user'),
        content: contentPayload
      });
    });
  }

  // 4. Cost safeguard: Trim excess context
  const safeMessages = trimHistoryForCostControl(formattedMessages);

  // 5. Delegate to resilient OpenRouter provider with tools enabled
  const providerResult = await createStreamWithResilience({
    model: resolved,
    messages: safeMessages,
    abortSignal,
    requestId,
    tools: [IMAGE_GENERATION_TOOL],
    tool_choice: 'auto'
  });

  const activeWriteChunk = resolveWriteChunk(requestId, customWriteChunk);

  // 6. Wrap stream to intercept autonomous tool calls
  const processedStream = processStreamWithTools(providerResult.stream, {
    writeChunk: activeWriteChunk,
    abortSignal,
    requestId
  });

  return {
    stream: processedStream,
    resolvedModel: providerResult.resolvedModel
  };
}

export default {
  MARKDOWN_FORMATTING_GUIDELINES,
  createCompletionStream
};
