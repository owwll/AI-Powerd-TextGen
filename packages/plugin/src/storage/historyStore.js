// ============================================================
// History Store
// In-memory (with optional file persistence) generation history
// ============================================================

import { randomUUID } from 'crypto';

/**
 * Simple in-memory store for generation history.
 * Can be extended to support database-backed storage.
 */
export class HistoryStore {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 1000;
    this.entries = [];
  }

  /**
   * Save a generation record.
   * @param {Object} record - { input, output, model, timestamp }
   * @returns {Promise<Object>} The saved record with generated ID
   */
  async save(record) {
    const entry = {
      id: randomUUID(),
      ...record,
      savedAt: new Date().toISOString(),
    };

    this.entries.unshift(entry); // newest first

    // Trim to maxEntries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    return entry;
  }

  /**
   * Query history with optional filters.
   * @param {Object} filters - { category, model, limit, offset }
   * @returns {Promise<Object>} { entries, total }
   */
  async query(filters = {}) {
    const { category, model, limit = 20, offset = 0 } = filters;

    let results = [...this.entries];

    if (category) {
      results = results.filter((e) =>
        e.input?.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (model) {
      results = results.filter((e) => e.model === model);
    }

    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return { entries: paginated, total, limit, offset };
  }

  /**
   * Get a single entry by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    return this.entries.find((e) => e.id === id) || null;
  }

  /**
   * Clear all entries.
   * @returns {Promise<void>}
   */
  async clear() {
    this.entries = [];
  }

  /**
   * Get total count of stored entries.
   * @returns {number}
   */
  get count() {
    return this.entries.length;
  }
}
