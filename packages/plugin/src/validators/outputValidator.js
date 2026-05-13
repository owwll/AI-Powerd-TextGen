// ============================================================
// Output Validator
// Validates and scores generated content for quality
// ============================================================

import { z } from 'zod';

/**
 * Schema for the expected output structure from the AI model.
 */
export const GeneratedContentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required'),

  description: z
    .string()
    .min(1, 'Description is required'),

  keywords: z
    .array(z.string())
    .optional()
    .default([]),

  metaDescription: z
    .string()
    .max(320, 'Meta description must be under 320 characters')
    .optional()
    .default(''),

  qualityScore: z.number().min(0).max(100).optional(),
});

/**
 * Validate and score the AI-generated content.
 *
 * @param {Object} content - Parsed content from the model
 * @param {Object} rules - Quality rules from config
 * @returns {Object} Validated content with quality score
 * @throws {Error} If content fails validation
 */
export function validateGeneratedContent(content, rules = {}) {
  const {
    minTitleLength = 20,
    maxTitleLength = 120,
    minDescriptionLength = 100,
    maxDescriptionLength = 2000,
    minKeywords = 3,
    maxKeywords = 15,
  } = rules;

  const errors = [];
  let score = 100;

  // --- Title Checks ---
  if (!content.title || typeof content.title !== 'string') {
    errors.push('Title is missing or invalid');
  } else {
    if (content.title.length < minTitleLength) {
      errors.push(`Title too short: ${content.title.length} < ${minTitleLength}`);
      score -= 20;
    }
    if (content.title.length > maxTitleLength) {
      errors.push(`Title too long: ${content.title.length} > ${maxTitleLength}`);
      score -= 10;
    }
  }

  // --- Description Checks ---
  if (!content.description || typeof content.description !== 'string') {
    errors.push('Description is missing or invalid');
  } else {
    if (content.description.length < minDescriptionLength) {
      score -= 15;
    }
    if (content.description.length > maxDescriptionLength) {
      errors.push(`Description too long: ${content.description.length} > ${maxDescriptionLength}`);
      score -= 10;
    }
  }

  // --- Keywords Checks ---
  if (!Array.isArray(content.keywords)) {
    content.keywords = [];
  }
  if (content.keywords.length < minKeywords) {
    score -= 10;
  }
  if (content.keywords.length > maxKeywords) {
    content.keywords = content.keywords.slice(0, maxKeywords);
  }

  // --- Prohibited Content Check ---
  const prohibited = [
    'i cannot', "i can't", 'as an ai', 'language model',
    'i am unable', 'i apologize',
  ];
  const allText = `${content.title} ${content.description}`.toLowerCase();
  for (const phrase of prohibited) {
    if (allText.includes(phrase)) {
      errors.push(`Prohibited phrase detected: "${phrase}"`);
      score -= 25;
    }
  }

  if (errors.length > 0) {
    throw new Error(`Output quality validation failed: ${errors.join('; ')}`);
  }

  // Parse and return with score
  const result = GeneratedContentSchema.parse({
    ...content,
    qualityScore: Math.max(0, score),
  });

  return result;
}
