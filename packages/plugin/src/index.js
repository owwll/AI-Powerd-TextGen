// ============================================================
// @evodart/ai-product-content-generator
// Main Plugin Entry Point
// ============================================================

import { validateProductInput } from './validators/inputValidator.js';
import { buildPrompt } from './prompt/promptBuilder.js';
import { callHuggingFaceModel } from './providers/huggingfaceProvider.js';
import { parseModelResponse } from './parsers/responseParser.js';
import { validateGeneratedContent } from './validators/outputValidator.js';
import { HistoryStore } from './storage/historyStore.js';
import { PluginConfigSchema } from './config/pluginConfig.js';
import { logger } from './utils/logger.js';
import { retryWithBackoff } from './utils/retry.js';

/**
 * Factory function to create a configured plugin instance.
 * This is the primary API surface for consumers of the plugin.
 *
 * @param {Object} userConfig - Configuration object for the plugin
 * @returns {Object} Plugin instance with generateContent() method
 */
export function createProductContentGenerator(userConfig = {}) {
  // Merge user config with defaults and validate
  const config = PluginConfigSchema.parse(userConfig);
  const historyStore = config.enableHistory ? new HistoryStore(config.historyOptions) : null;

  logger.info('Plugin initialized', {
    model: config.model,
    enableHistory: config.enableHistory,
    retries: config.maxRetries,
  });

  /**
   * Generate SEO-optimized product content from structured attributes.
   *
   * @param {Object} productData - The product data to generate content for
   * @returns {Promise<GeneratedContent>} The generated content object
   */
  async function generateContent(productData) {
    // Step 1: Validate input
    const validated = validateProductInput(productData);
    logger.info('Input validated', { category: validated.category });

    // Step 2: Build the AI prompt
    const prompt = buildPrompt(validated, config.promptTemplate);
    logger.debug('Prompt built', { promptLength: prompt.length });

    // Step 3: Call AI model with retry support
    const rawResponse = await retryWithBackoff(
      () => callHuggingFaceModel(prompt, config),
      {
        maxRetries: config.maxRetries,
        delayMs: config.retryDelayMs,
        onRetry: (attempt, err) => {
          logger.warn(`Retry attempt ${attempt}`, { error: err.message });
        },
      }
    );

    // Step 4: Parse the structured response
    const parsed = parseModelResponse(rawResponse);
    logger.debug('Response parsed', { title: parsed.title });

    // Step 5: Validate output quality
    const validated_output = validateGeneratedContent(parsed, config.qualityRules);
    logger.info('Content validation passed', { category: validated.category });

    // Step 6: Optionally persist to history
    if (historyStore) {
      await historyStore.save({
        input: validated,
        output: validated_output,
        model: config.model,
        timestamp: new Date().toISOString(),
      });
    }

    return validated_output;
  }

  /**
   * Retrieve history of past generations (if history is enabled).
   * @returns {Promise<Array>}
   */
  async function getHistory(filters = {}) {
    if (!historyStore) {
      throw new Error('History is not enabled. Set enableHistory: true in config.');
    }
    return historyStore.query(filters);
  }

  /**
   * Clear the generation history.
   */
  async function clearHistory() {
    if (!historyStore) return;
    await historyStore.clear();
  }

  return { generateContent, getHistory, clearHistory, config };
}

// Named export for direct use without factory
export { validateProductInput } from './validators/inputValidator.js';
export { buildPrompt } from './prompt/promptBuilder.js';
export { PluginConfigSchema } from './config/pluginConfig.js';
