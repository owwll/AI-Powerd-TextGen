// ============================================================
// Retry Utility
// Exponential backoff retry wrapper
// ============================================================

/**
 * Retry an async function with exponential backoff.
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options
 * @param {number} options.maxRetries - Maximum number of retry attempts
 * @param {number} options.delayMs - Base delay in milliseconds
 * @param {Function} options.onRetry - Called on each retry: (attempt, error) => void
 * @returns {Promise<any>} Result of the successful function call
 * @throws {Error} Last error if all retries exhausted
 */
export async function retryWithBackoff(fn, options = {}) {
  const { maxRetries = 2, delayMs = 1000, onRetry = () => {} } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        onRetry(attempt + 1, err);
        // Exponential backoff: delayMs * 2^attempt + jitter
        const backoff = delayMs * Math.pow(2, attempt) + Math.random() * 200;
        await sleep(backoff);
      }
    }
  }

  throw lastError;
}

/**
 * Simple sleep utility.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
