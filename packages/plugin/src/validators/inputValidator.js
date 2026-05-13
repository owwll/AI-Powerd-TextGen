// ============================================================
// Input Validator
// Validates product input data before sending to the AI model
// ============================================================

import { z } from 'zod';

/**
 * Zod schema for product input attributes (flexible key-value map).
 */
const ProductAttributesSchema = z.record(
  z.string().min(1),
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
);

/**
 * Zod schema for the full product input.
 */
export const ProductInputSchema = z.object({
  /**
   * The product category (e.g., "Smartphones", "Laptops", "Shoes").
   */
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be under 100 characters')
    .trim(),

  /**
   * Structured product attributes (e.g., brand, color, size).
   */
  attributes: ProductAttributesSchema.default({}),

  /**
   * Technical specifications (e.g., processor, RAM, storage).
   */
  specifications: ProductAttributesSchema.optional().default({}),

  /**
   * Key product features as an array of short strings.
   */
  features: z
    .array(z.string().min(1).max(200))
    .max(20, 'Maximum 20 features allowed')
    .optional()
    .default([]),

  /**
   * Optional brand name override (can also be in attributes).
   */
  brand: z.string().max(100).optional(),

  /**
   * Target language for output content.
   */
  language: z.string().default('English'),

  /**
   * Optional tone override (professional, casual, luxury, etc.).
   */
  tone: z
    .enum(['professional', 'casual', 'luxury', 'technical', 'friendly'])
    .default('professional'),

  /**
   * Additional metadata (flexible).
   */
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

/**
 * Validate and sanitize product input.
 *
 * @param {Object} data - Raw product input from caller
 * @returns {Object} Validated and normalized product data
 * @throws {ZodError} If validation fails
 */
export function validateProductInput(data) {
  const result = ProductInputSchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `[${i.path.join('.')}] ${i.message}`)
      .join('; ');
    throw new Error(`Input validation failed: ${issues}`);
  }

  return result.data;
}
