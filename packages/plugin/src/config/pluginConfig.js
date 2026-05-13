// ============================================================
// Plugin Configuration Schema
// Uses Zod for runtime validation and typed defaults
// ============================================================

import { z } from 'zod';

export const PluginConfigSchema = z.object({
  /**
   * Hugging Face API token.
   * Required for model inference requests.
   */
  hfApiToken: z
    .string()
    .min(1, 'hfApiToken is required')
    .default(() => process.env.HF_API_TOKEN || ''),

  /**
   * Hugging Face Model ID to use for inference.
   * Defaults to Qwen/Qwen2.5-14B-Instruct.
   */
  model: z
    .string()
    .default(() => process.env.HF_MODEL_ID || 'Qwen/Qwen2.5-14B-Instruct:featherless-ai'),

  /**
   * Hugging Face Inference API base URL.
   */
  inferenceBaseUrl: z
    .string()
    .url()
    .default('https://router.huggingface.co/v1'),

  /**
   * Maximum tokens the model should generate.
   */
  maxNewTokens: z.number().int().positive().default(512),

  /**
   * Temperature for response generation (0=deterministic, 1=creative).
   */
  temperature: z.number().min(0).max(1).default(0.7),

  /**
   * Top-p nucleus sampling parameter.
   */
  topP: z.number().min(0).max(1).default(0.9),

  /**
   * Maximum retry attempts on model call failure.
   */
  maxRetries: z.number().int().min(0).max(5).default(2),

  /**
   * Delay in milliseconds between retry attempts (exponential backoff applied).
   */
  retryDelayMs: z.number().int().positive().default(1000),

  /**
   * Request timeout in milliseconds.
   */
  timeoutMs: z.number().int().positive().default(90000),

  /**
   * Enable or disable generation history persistence.
   */
  enableHistory: z.boolean().default(false),

  /**
   * Options for the history store (used if enableHistory is true).
   */
  historyOptions: z
    .object({
      maxEntries: z.number().int().positive().default(1000),
      storagePath: z.string().optional(),
    })
    .default({}),

  /**
   * Quality validation rules for generated content.
   */
  qualityRules: z
    .object({
      minTitleLength: z.number().int().default(20),
      maxTitleLength: z.number().int().default(120),
      minDescriptionLength: z.number().int().default(100),
      maxDescriptionLength: z.number().int().default(2000),
      minKeywords: z.number().int().default(3),
      maxKeywords: z.number().int().default(15),
    })
    .default({}),

  /**
   * Optional custom prompt template function.
   * Receives (productData, defaultTemplate) and returns a string.
   */
  promptTemplate: z.function().optional(),

  /**
   * Log level: 'silent' | 'error' | 'warn' | 'info' | 'debug'
   */
  logLevel: z.enum(['silent', 'error', 'warn', 'info', 'debug']).default('info'),
});
