// ============================================================
// Response Parser
// Extracts structured JSON from the raw AI model output
// ============================================================

/**
 * Attempt to extract a JSON object from a raw text string.
 * Handles models that wrap JSON in markdown code blocks or add extra text.
 *
 * @param {string} rawText - Raw text output from the model
 * @returns {Object} Parsed content object
 * @throws {Error} If no valid JSON can be extracted
 */
export function parseModelResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Model returned empty or invalid response');
  }

  const text = rawText.trim();

  // Strategy 1: Try parsing the entire response as JSON
  try {
    const parsed = JSON.parse(text);
    if (isValidContentShape(parsed)) return normalizeContent(parsed);
  } catch (_) {}

  // Strategy 2: Extract JSON from a markdown code block ```json ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (isValidContentShape(parsed)) return normalizeContent(parsed);
    } catch (_) {}
  }

  // Strategy 3: Find the first { ... } block in the text
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (isValidContentShape(parsed)) return normalizeContent(parsed);
    } catch (_) {}
  }

  // Strategy 4: Find the LAST complete JSON object (greedy)
  const greedyMatch = text.match(/\{[\s\S]*\}/);
  if (greedyMatch) {
    try {
      const parsed = JSON.parse(greedyMatch[0]);
      if (isValidContentShape(parsed)) return normalizeContent(parsed);
    } catch (_) {}
  }

  throw new Error(
    `Failed to extract valid JSON from model response. Raw output (first 500 chars):\n${text.slice(0, 500)}`
  );
}

/**
 * Check if a parsed object has the minimum required fields.
 * @param {any} obj
 * @returns {boolean}
 */
function isValidContentShape(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string'
  );
}

/**
 * Normalize the parsed content to ensure consistent field types.
 * @param {Object} obj
 * @returns {Object}
 */
function normalizeContent(obj) {
  return {
    title: String(obj.title || '').trim(),
    description: String(obj.description || '').trim(),
    keywords: Array.isArray(obj.keywords)
      ? obj.keywords.map((k) => String(k).trim()).filter(Boolean)
      : typeof obj.keywords === 'string'
      ? obj.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [],
    metaDescription: String(obj.metaDescription || obj.meta_description || '').trim(),
  };
}
