import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '../..');

/**
 * Read and parse a .env file, returning key/value pairs.
 * Falls back gracefully if the file doesn't exist.
 */
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) result[key] = val;
  }
  return result;
}

// Read env from workspace root .env and demo-local .env, with root taking priority
const rootEnvVars = parseEnvFile(resolve(workspaceRoot, '.env'));
const demoEnvVars = parseEnvFile(resolve(__dirname, '.env'));
const demoLocalEnvVars = parseEnvFile(resolve(__dirname, '.env.local'));

// Merge: demo local > demo > root
const allEnvVars = { ...rootEnvVars, ...demoEnvVars, ...demoLocalEnvVars };

const configuredToken = (
  allEnvVars.HF_API_TOKEN ||
  allEnvVars.VITE_HF_API_TOKEN ||
  process.env.HF_API_TOKEN ||
  ''
).trim();

const configuredModelServerUrl = (
  allEnvVars.HF_ENDPOINT_URL ||
  allEnvVars.MODEL_SERVER_URL ||
  process.env.HF_ENDPOINT_URL ||
  'https://router.huggingface.co/v1'
).trim();

const configuredModelId = (
  allEnvVars.HF_MODEL_ID ||
  allEnvVars.MODEL_SERVER_ID ||
  process.env.HF_MODEL_ID ||
  'Qwen/Qwen2.5-7B-Instruct'
).trim();

console.log(`[HF Proxy] Token loaded: ${configuredToken ? `yes (${configuredToken.slice(0, 8)}...)` : 'NO - set HF_API_TOKEN in root .env'}`);
console.log(`[HF Proxy] Model: ${configuredModelId}`);
console.log(`[HF Proxy] Endpoint: ${configuredModelServerUrl}`);

function buildChatPrompt(productData) {
  const {
    category,
    brand,
    attributes = {},
    specifications = {},
    features = [],
    language = 'English',
    tone = 'professional',
  } = productData || {};

  const formatObject = (obj) => {
    const entries = Object.entries(obj || {});
    if (entries.length === 0) return 'None provided';
    return entries
      .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
      .join('\n');
  };

  const formatFeatures = (items) => {
    if (!Array.isArray(items) || items.length === 0) return 'None provided';
    return items.map((item) => `- ${item}`).join('\n');
  };

  return `Generate SEO-optimized product content.

Category: ${category || ''}
${brand ? `Brand: ${brand}` : ''}
Language: ${language}
Tone: ${tone}

Attributes:
${formatObject(attributes)}

Specifications:
${formatObject(specifications)}

Features:
${formatFeatures(features)}

Return ONLY valid JSON with this shape:
{
  "title": "keyword-rich title",
  "description": "engaging description",
  "keywords": ["kw1", "kw2", "kw3"],
  "metaDescription": "SEO meta description under 160 chars"
}`;
}

function createHfProxy() {
  return async function hfProxyMiddleware(req, res, next) {
    const requestPath = new URL(req.url, 'http://localhost').pathname.replace(/\/+$/, '');
    if (req.method !== 'POST' || requestPath !== '/api/generate') {
      next();
      return;
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    let payload;
    try {
      const rawBody = Buffer.concat(chunks).toString('utf8') || '{}';
      payload = JSON.parse(rawBody);
    } catch (error) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON request body.' }));
      return;
    }

    const token = String(payload.hfApiToken || configuredToken).trim();
    const endpointUrl = configuredModelServerUrl || 'https://router.huggingface.co/v1';
    const model = String(payload.model || configuredModelId).trim() || 'Qwen/Qwen2.5-7B-Instruct';

    if (!token) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Set HF_API_TOKEN in the workspace .env to call Hugging Face API.',
      }));
      return;
    }

    const userPrompt = payload.productData ? buildChatPrompt(payload.productData) : String(payload.prompt || '').trim();
    const requestUrl = `${endpointUrl.replace(/\/+$/, '')}/chat/completions`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert e-commerce SEO copywriter. You MUST respond ONLY with valid JSON. No markdown formatting, no code blocks, no explanations, no preamble, no extra text whatsoever. Output only the raw JSON object."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: payload.maxNewTokens ?? 2048,
        temperature: payload.temperature ?? 0.3,
        top_p: 0.9,
        response_format: { type: "json_object" },
      }),
    });

    const bodyText = await response.text();
    if (!response.ok) {
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(bodyText);
      return;
    }

    res.statusCode = response.status;
    res.setHeader('Content-Type', 'application/json');
    try {
      const parsed = JSON.parse(bodyText);
      // Handle HF Inference API (OpenAI chat completions format)
      let rawText = parsed.choices?.[0]?.message?.content
        || (Array.isArray(parsed) ? parsed[0]?.generated_text : parsed?.generated_text)
        || '';

      if (typeof rawText === 'object' && rawText !== null) {
        rawText = JSON.stringify(rawText);
      } else {
        rawText = String(rawText);
      }

      // Strip <think>...</think> reasoning blocks (Qwen reasoning models)
      rawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      // Strip markdown code fences if any remain (```json ... ``` or ``` ... ```)
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      if (!rawText) {
        console.error('[HF Proxy] Empty text after cleanup. Full HF response:', JSON.stringify(parsed, null, 2));
        res.statusCode = 502;
        res.end(JSON.stringify({
          error: 'Model returned an empty response. Check your HF token permissions and model availability.',
          _debug_hf_response: parsed,
        }));
        return;
      }

      console.log('[HF Proxy] Success. Text length:', rawText.length);
      res.end(JSON.stringify({ generated_text: rawText }));
    } catch (error) {
      console.error('[HF Proxy] Failed to parse HF response JSON:', error.message);
      res.statusCode = 502;
      res.end(JSON.stringify({
        error: 'Failed to parse response from Hugging Face API.',
        _debug_raw: bodyText.slice(0, 500),
      }));
    }
  };
}

export default defineConfig(() => {
  const proxy = createHfProxy();

  return {
    plugins: [
      {
        name: 'demo-hf-proxy',
        configureServer(server) {
          server.middlewares.use(proxy);
        },
        configurePreviewServer(server) {
          server.middlewares.use(proxy);
        },
      },
    ],
  };
});