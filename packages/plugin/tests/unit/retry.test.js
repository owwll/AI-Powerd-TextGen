// ============================================================
// Retry Utility Tests
// ============================================================

import { retryWithBackoff } from '../../src/utils/retry.js';
import { describe, it, expect, jest } from '@jest/globals';

describe('retryWithBackoff', () => {
  it('should succeed on first try without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, { maxRetries: 3, delayMs: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry and succeed on second attempt', async () => {
    let calls = 0;
    const fn = jest.fn().mockImplementation(async () => {
      calls++;
      if (calls < 2) throw new Error('Transient error');
      return 'success on second try';
    });
    const result = await retryWithBackoff(fn, { maxRetries: 3, delayMs: 5 });
    expect(result).toBe('success on second try');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw last error after all retries exhausted', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
    await expect(
      retryWithBackoff(fn, { maxRetries: 2, delayMs: 5 })
    ).rejects.toThrow('Persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should call onRetry callback for each retry', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const onRetry = jest.fn();
    await expect(
      retryWithBackoff(fn, { maxRetries: 2, delayMs: 5, onRetry })
    ).rejects.toThrow();
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('should not retry when maxRetries is 0', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('immediate fail'));
    await expect(
      retryWithBackoff(fn, { maxRetries: 0, delayMs: 5 })
    ).rejects.toThrow('immediate fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
