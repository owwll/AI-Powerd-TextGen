// ============================================================
// Input Validator Tests
// ============================================================

import { validateProductInput } from '../../src/validators/inputValidator.js';
import { describe, it, expect } from '@jest/globals';

describe('validateProductInput', () => {
  it('should accept minimal valid input (category only)', () => {
    const result = validateProductInput({ category: 'Smartphones' });
    expect(result.category).toBe('Smartphones');
    expect(result.language).toBe('English');
    expect(result.tone).toBe('professional');
    expect(result.attributes).toEqual({});
  });

  it('should accept full valid input', () => {
    const input = {
      category: 'Laptops',
      brand: 'TechBrand',
      attributes: { color: 'Silver', weight: '1.4kg' },
      specifications: { RAM: '16GB', Storage: '512GB SSD' },
      features: ['Fast charging', 'Lightweight design'],
      language: 'English',
      tone: 'professional',
    };
    const result = validateProductInput(input);
    expect(result.category).toBe('Laptops');
    expect(result.brand).toBe('TechBrand');
    expect(result.features).toHaveLength(2);
  });

  it('should throw on missing category', () => {
    expect(() => validateProductInput({})).toThrow('Input validation failed');
  });

  it('should throw on empty category string', () => {
    expect(() => validateProductInput({ category: '' })).toThrow('Input validation failed');
  });

  it('should accept array values in attributes', () => {
    const result = validateProductInput({
      category: 'Shoes',
      attributes: { sizes: ['39', '40', '41', '42'] },
    });
    expect(result.attributes.sizes).toEqual(['39', '40', '41', '42']);
  });

  it('should trim whitespace from category', () => {
    const result = validateProductInput({ category: '  Watches  ' });
    expect(result.category).toBe('Watches');
  });

  it('should reject invalid tone value', () => {
    expect(() =>
      validateProductInput({ category: 'Books', tone: 'aggressive' })
    ).toThrow('Input validation failed');
  });

  it('should handle special characters in attributes', () => {
    const result = validateProductInput({
      category: 'Smartphones',
      attributes: { name: 'iPhone 15 Pro — Titanium™' },
    });
    expect(result.attributes.name).toBe('iPhone 15 Pro — Titanium™');
  });

  it('should limit features to max 20 entries', () => {
    const features = Array.from({ length: 25 }, (_, i) => `Feature ${i + 1}`);
    expect(() =>
      validateProductInput({ category: 'Laptops', features })
    ).toThrow('Input validation failed');
  });
});
