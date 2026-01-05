/**
 * Money formatting utilities
 * 
 * Handles conversion from cents to display format.
 * All prices in the database are stored in cents (integers).
 */

/**
 * Format cents to money string
 * 
 * @param cents - Price in cents (can be null/undefined)
 * @param currency - Currency code (defaults to 'USD')
 * @returns Formatted string like "$12.99" or "—" if cents is null/undefined
 */
export function formatMoneyFromCents(
  cents: number | null | undefined,
  currency: string = 'USD'
): string {
  if (cents === null || cents === undefined) {
    return '—';
  }

  // Convert cents to dollars
  const dollars = cents / 100;

  // Format as currency (USD only for now, but currency param is kept for future)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Convert dollars to cents
 * 
 * @param dollars - Price in dollars
 * @returns Price in cents (rounded to nearest integer)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * 
 * @param cents - Price in cents
 * @returns Price in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}



