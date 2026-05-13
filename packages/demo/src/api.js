// ── Hugging Face API bridge: calls the Hugging Face Inference API directly.

const HF_BASE_URL = import.meta.env.VITE_HF_ENDPOINT_URL || 'https://router.huggingface.co/v1';
const HF_MODEL_ID = import.meta.env.VITE_HF_MODEL_ID || 'Qwen/Qwen2.5-7B-Instruct';
const MODEL = HF_MODEL_ID;

/**
 * Build the plain prompt from product data.
 */
function buildPrompt(productData) {
  const { category, brand, attributes = {}, specifications = {}, features = [], language = 'English', tone = 'professional' } = productData;

  const fmtObj = obj => Object.entries(obj).length
    ? Object.entries(obj).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
    : 'None provided';

  const fmtFeatures = arr => arr.length
    ? arr.map(f => `• ${f}`).join('\n')
    : 'None provided';

  return `You are an expert e-commerce SEO copywriter. Respond ONLY with valid JSON. No markdown, no extra text.

Generate SEO-optimized product content.

Category: ${category}
${brand ? `Brand: ${brand}` : ''}
Language: ${language}
Tone: ${tone}

Attributes:
${fmtObj(attributes)}

Specifications:
${fmtObj(specifications)}

Features:
${fmtFeatures(features)}

Return ONLY this JSON:
{
  "title": "keyword-rich title (60-100 chars)",
  "description": "engaging description (150-400 words)",
  "keywords": ["kw1", "kw2", "kw3", "...up to 10"],
  "metaDescription": "SEO meta description under 160 chars"
}`;
}

/**
 * Parse JSON from a raw model response string using multiple strategies.
 */
function parseResponse(raw) {
  // Strip <think>...</think> reasoning blocks (Qwen models sometimes include them)
  let text = (raw || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  // Try direct parse
  try { const p = JSON.parse(text); if (p.title && p.description) return normalize(p); } catch (_) { }

  // Extract from code block (inner content, if any survived)
  const cbMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cbMatch) try { const p = JSON.parse(cbMatch[1].trim()); if (p.title) return normalize(p); } catch (_) { }

  // Find first complete {...} object
  const jMatch = text.match(/\{[\s\S]*\}/);
  if (jMatch) try { const p = JSON.parse(jMatch[0]); if (p.title) return normalize(p); } catch (_) { }

  throw new Error(`Could not parse AI response. The model may not have returned valid JSON. Try again.\n\nRaw output received: ${text.slice(0, 200)}...`);
}

function normalize(p) {
  return {
    title: String(p.title || '').trim(),
    description: String(p.description || '').trim(),
    keywords: Array.isArray(p.keywords) ? p.keywords.map(k => String(k).trim()).filter(Boolean)
      : typeof p.keywords === 'string' ? p.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
    metaDescription: String(p.metaDescription || p.meta_description || '').trim(),
    qualityScore: computeScore(p),
  };
}

function computeScore(p) {
  let score = 100;
  const title = p.title || '';
  const desc = p.description || '';
  if (title.length < 20) score -= 20;
  if (title.length > 120) score -= 10;
  if (desc.length < 100) score -= 15;
  const prohibited = ['i cannot', "i can't", 'as an ai', 'language model', 'i am unable'];
  const text = `${title} ${desc}`.toLowerCase();
  prohibited.forEach(ph => { if (text.includes(ph)) score -= 25; });
  return Math.max(0, score);
}

/**
 * Call the demo proxy, which forwards the request to HuggingFace.
 * @param {Object} productData
 * @param {Object} config - { hfApiToken, maxNewTokens, temperature }
 */
export async function callGenerateAPI(productData, config) {
  const { hfApiToken, maxNewTokens = 2048, temperature = 0.3 } = config;

  const requestBody = {
    model: MODEL,
    productData,
    hfApiToken: hfApiToken.trim(),
    maxNewTokens,
    temperature,
  };

  let response;
  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    throw new Error(`Network error calling proxy: ${err.message}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    let parsed = null;
    try { parsed = JSON.parse(body); } catch (_) {}
    let msg = parsed?.error || body;
    if (typeof msg === 'object' && msg !== null) {
      msg = msg.message || JSON.stringify(msg);
    }
    msg = String(msg);
    if (response.status === 400) throw new Error(msg || 'Missing Hugging Face API token or invalid request payload.');
    if (response.status === 401) throw new Error('Invalid API token (401). Check your Hugging Face token.');
    if (response.status === 403) throw new Error(`Access denied (403). Check your token permissions on Hugging Face.`);
    if (response.status === 502) throw new Error(`Proxy/model error (502): ${msg.slice(0, 300)}`);
    if (response.status === 503) throw new Error('Model is loading or unavailable (503). Please wait and try again.');
    if (response.status === 429) throw new Error('Rate limit exceeded (429). Please wait before retrying.');
    throw new Error(`API error ${response.status}: ${msg.slice(0, 200)}`);
  }

  const data = await response.json();
  let rawText = data?.choices?.[0]?.message?.content
    || data?.generated_text
    || data?.choices?.[0]?.text
    || '';

  if (typeof rawText === 'object' && rawText !== null) {
    rawText = JSON.stringify(rawText);
  } else {
    rawText = String(rawText);
  }

  // Client-side safety: strip <think>...</think> reasoning blocks
  rawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip any leftover markdown code fences
  rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  if (!rawText) {
    const debugInfo = data._debug_hf_response ? JSON.stringify(data._debug_hf_response) : JSON.stringify(data);
    throw new Error(`Model returned an empty response. Full response: ${debugInfo.slice(0, 300)}`);
  }

  return parseResponse(rawText);
}
