// ============================================================
// Prompt Builder
// Constructs structured prompts
// from product data
// ============================================================

/**
 * Default system context for the AI model.
 */
const SYSTEM_CONTEXT = `You are an expert e-commerce SEO copywriter with deep knowledge of digital marketing best practices.
Your task is to generate compelling, accurate, and SEO-optimized product content.
You MUST always respond with valid JSON only. No additional text, no markdown code blocks, just raw JSON.
Use only the information provided. Do not invent or hallucinate specifications.`;

/**
 * Format a key-value map into a readable list for the prompt.
 * @param {Object} obj
 * @returns {string}
 */
function formatAttributes(obj) {
  if (!obj || Object.keys(obj).length === 0) return 'None provided';
  return Object.entries(obj)
    .map(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
      return `- ${displayKey}: ${displayValue}`;
    })
    .join('\n');
}

/**
 * Format features list for the prompt.
 * @param {Array<string>} features
 * @returns {string}
 */
function formatFeatures(features) {
  if (!features || features.length === 0) return 'None provided';
  return features.map((f) => `• ${f}`).join('\n');
}

/**
 * Build the complete prompt string for the AI model.
 *
 * @param {Object} productData - Validated product data
 * @param {Function|undefined} customTemplate - Optional template override from config
 * @returns {string} The final prompt string
 */
export function buildPrompt(productData, customTemplate = undefined) {
  // Allow consumer to override the entire prompt
  if (typeof customTemplate === 'function') {
    return customTemplate(productData, buildDefaultPrompt);
  }
  return buildDefaultPrompt(productData);
}

/**
 * Build the default Qwen-Instruct formatted prompt.
 * Build the default prompt format.
 *
 * @param {Object} productData
 * @returns {string}
 */
function buildDefaultPrompt(productData) {
  const { category, attributes, specifications, features, brand, language, tone, metadata } =
    productData;

  const brandLine = brand ? `Brand: ${brand}` : '';
  const metadataSection =
    metadata && Object.keys(metadata).length > 0
      ? `\nAdditional Context:\n${formatAttributes(metadata)}`
      : '';

  const userMessage = `Generate SEO-optimized product content for the following product.

Category: ${category}
${brandLine}
Language: ${language}
Tone: ${tone}

Attributes:
${formatAttributes(attributes)}

Technical Specifications:
${formatAttributes(specifications)}

Key Features:
${formatFeatures(features)}
${metadataSection}

You MUST return ONLY a valid JSON object with exactly these fields:
{
  "title": "A compelling, keyword-rich product title (60-100 characters)",
  "description": "An engaging, informative product description (150-500 words). Include key benefits, specifications, and a call to action.",
  "keywords": ["keyword1", "keyword2", "keyword3", "...up to 10 keywords"],
  "metaDescription": "A concise meta description for SEO (150-160 characters)"
}

Rules:
1. The title must be concise, searchable, and include the brand (if provided) and key attributes.
2. The description must be natural, engaging, and mention important specs and features.
3. Keywords must be specific to this product (not generic).
4. The meta description must be under 160 characters and entice clicks.
5. Use ONLY the provided information. Do not invent specifications.
6. Return ONLY the JSON object. No other text.`;

  return `${SYSTEM_CONTEXT}\n\n${userMessage}`;
}
