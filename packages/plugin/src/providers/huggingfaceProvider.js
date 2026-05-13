// ============================================================
// Hugging Face Inference Provider
// Handles all communication with the Hugging Face Inference API
// ============================================================

/**
 * Call the Hugging Face API with the given prompt and config.
 *
 * @param {string} prompt - The fully built prompt string
 * @param {Object} config - Validated plugin config
 * @returns {Promise<string>} Raw text response from the model
 * @throws {Error} On API error or timeout
 */
export async function callHuggingFaceModel(prompt, config) {
  const {
    hfApiToken,
    model,
    inferenceBaseUrl,
    maxNewTokens,
    temperature,
    topP,
    timeoutMs,
  } = config;

  const url = `${inferenceBaseUrl.replace(/\/+$/, '')}/chat/completions`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    const requestBody = {
      model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxNewTokens,
      temperature,
      top_p: topP
    };

    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfApiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Model request timed out after ${timeoutMs}ms`);
    }
    throw new Error(`Network error calling Hugging Face API: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle non-200 responses
  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch (_) {}

    if (response.status === 401) {
      throw new Error('Hugging Face API: Invalid or missing API token (401 Unauthorized). Check your HF_API_TOKEN.');
    }
    if (response.status === 403) {
      throw new Error(`Hugging Face API: Access denied. Check token permissions.`);
    }
    if (response.status === 503) {
      throw new Error(`Hugging Face API: Model is loading or unavailable. Will retry. (503)`);
    }
    if (response.status === 429) {
      throw new Error('Hugging Face API: Rate limit exceeded. Please wait before retrying. (429)');
    }

    throw new Error(
      `Hugging Face API error ${response.status}: ${body.slice(0, 300)}`
    );
  }

  const data = await response.json();

  // Handle OpenAI API response format
  if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    if (data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    }
  }

  // Some models return a different structure
  if (data.generated_text) {
    return data.generated_text;
  }

  throw new Error(`Unexpected response structure from API: ${JSON.stringify(data).slice(0, 300)}`);
}
