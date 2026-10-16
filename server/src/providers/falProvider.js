import logger from '../utils/logger.js';
import { executeImageGeneration } from '../services/imageService.js';

/**
 * Neutralized Fal.ai provider.
 * Image generation has migrated to OpenRouter Images API (FLUX.2 Klein 4B) in imageService.js.
 * This compatibility wrapper safely delegates any legacy calls to executeImageGeneration.
 */
export async function generateFalImage({
  prompt,
  abortSignal = null,
  requestId = '-'
}) {
  logger.debug('generateFalImage invoked; delegating to OpenRouter FLUX.2 Klein 4B', { requestId });
  return await executeImageGeneration({
    prompt,
    abortSignal,
    requestId
  });
}

export default {
  generateFalImage
};
