/**
 * Search normalization utilities
 * 
 * Handles ISBN normalization and search query preparation.
 */

/**
 * Normalize search query
 * 
 * Removes hyphens, spaces, and converts to lowercase for consistent searching.
 * Useful for ISBN searches where users might enter "978-0143126393" or "9780143126393".
 * 
 * @param query - Raw search query
 * @returns Normalized query (trimmed, lowercase, alphanumeric only)
 */
export function normalizeSearch(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, ''); // Remove all non-alphanumeric characters
}

/**
 * Check if a normalized query looks like an ISBN
 * 
 * ISBN-10: 10 digits (may end with X)
 * ISBN-13: 13 digits (usually starts with 978 or 979)
 * 
 * @param normalizedQuery - Normalized search query
 * @returns true if query appears to be an ISBN
 */
export function isISBNQuery(normalizedQuery: string): boolean {
  // Check for ISBN-10 (10 digits, may end with X)
  if (/^\d{9}[\dx]$/i.test(normalizedQuery)) {
    return true;
  }
  
  // Check for ISBN-13 (13 digits, usually starts with 978 or 979)
  if (/^(978|979)\d{10}$/.test(normalizedQuery)) {
    return true;
  }
  
  return false;
}

/**
 * Extract ISBN from query if present
 * 
 * @param query - Raw search query
 * @returns Normalized ISBN string or null if not an ISBN
 */
export function extractISBN(query: string): string | null {
  const normalized = normalizeSearch(query);
  if (isISBNQuery(normalized)) {
    return normalized;
  }
  return null;
}




