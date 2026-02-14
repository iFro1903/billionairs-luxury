/**
 * Shared helper utilities for BILLIONAIRS API
 * Works in both Edge Runtime and Node.js
 */

/**
 * Generate a unique member ID
 * Format: BILL-{timestamp}-{random}
 * @returns {string} Unique member ID
 */
export function generateMemberId() {
    return `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}
