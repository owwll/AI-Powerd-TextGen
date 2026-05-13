// ============================================================
// Response Parser Tests
// ============================================================

import { parseModelResponse } from '../../src/parsers/responseParser.js';
import { describe, it, expect } from '@jest/globals';

const VALID_JSON = JSON.stringify({
  title: 'Samsung Galaxy S24 Ultra 512GB Titanium Black Smartphone',
  description: 'Experience the future with Samsung Galaxy S24 Ultra. Featuring a stunning 6.8-inch Dynamic AMOLED display, 200MP camera system, and the powerful Snapdragon 8 Gen 3 processor, this smartphone delivers unmatched performance. With 12GB RAM and 512GB storage, multitasking is seamless. Built with premium titanium and a 5000mAh battery with 45W fast charging, stay powered all day.',
  keywords: ['Samsung Galaxy S24 Ultra', 'flagship smartphone', '200MP camera', 'Snapdragon 8 Gen 3'],
  metaDescription: 'Buy Samsung Galaxy S24 Ultra 512GB Titanium Black. 200MP camera, 6.8-inch display, Snapdragon 8 Gen 3. Free shipping.',
});

describe('parseModelResponse', () => {
  it('should parse a clean JSON string', () => {
    const result = parseModelResponse(VALID_JSON);
    expect(result.title).toContain('Samsung Galaxy');
    expect(result.keywords).toHaveLength(4);
  });

  it('should extract JSON from markdown code block', () => {
    const wrapped = `Here is the content:\n\`\`\`json\n${VALID_JSON}\n\`\`\``;
    const result = parseModelResponse(wrapped);
    expect(result.title).toContain('Samsung Galaxy');
  });

  it('should extract JSON from plain markdown code block (no language tag)', () => {
    const wrapped = `\`\`\`\n${VALID_JSON}\n\`\`\``;
    const result = parseModelResponse(wrapped);
    expect(result.title).toContain('Samsung Galaxy');
  });

  it('should extract JSON from text with preamble', () => {
    const withPreamble = `Sure, here is the JSON output for your product:\n\n${VALID_JSON}\n\nLet me know if you need changes.`;
    const result = parseModelResponse(withPreamble);
    expect(result.title).toContain('Samsung Galaxy');
  });

  it('should throw on empty response', () => {
    expect(() => parseModelResponse('')).toThrow();
  });

  it('should throw on null response', () => {
    expect(() => parseModelResponse(null)).toThrow();
  });

  it('should throw on response with no valid JSON', () => {
    expect(() => parseModelResponse('I cannot generate content for this request.')).toThrow();
  });

  it('should normalize keywords from comma-separated string', () => {
    const jsonWithStringKeywords = JSON.stringify({
      title: 'Test Product Title For Running Tests Today',
      description: 'This is a test description that is long enough to pass validation requirements easily.',
      keywords: 'keyword1, keyword2, keyword3',
      metaDescription: 'Test meta description.',
    });
    const result = parseModelResponse(jsonWithStringKeywords);
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords).toContain('keyword1');
  });

  it('should handle missing optional fields gracefully', () => {
    const minimal = JSON.stringify({
      title: 'Minimal Product Title That Is Long Enough To Pass',
      description: 'A minimal description for testing the parser behavior when optional fields are absent from the response.',
    });
    const result = parseModelResponse(minimal);
    expect(result.keywords).toEqual([]);
    expect(result.metaDescription).toBe('');
  });
});
