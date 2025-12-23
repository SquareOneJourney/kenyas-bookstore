import { z } from 'zod';

/**
 * Validation schemas for type-safe runtime validation
 * Used for API requests, form inputs, and external API responses
 */

export const BookSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  author: z.string().min(1),
  genre: z.string(),
  price: z.number().positive(),
  isbn: z.string(),
  isbn13: z.string().optional(),
  isbn10: z.string().optional(),
  description: z.string(),
  stock: z.number().int().nonnegative(),
  coverUrl: z.string().url(),
  condition: z.enum(['New', 'Like New', 'Very Good', 'Good', 'Acceptable']),
  location: z.string(),
  tags: z.array(z.string()),
  costBasis: z.number().positive().optional(),
  pageCount: z.number().int().positive().optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  binding: z.enum(['Hardcover', 'Paperback', 'Mass Market', 'Other']).optional(),
  supplySource: z.enum(['local', 'ingram']),
  ingramStockLevel: z.enum(['In Stock', 'Low Stock', 'Out of Stock']).optional(),
  lastStockSync: z.string().optional(),
  availabilityMessage: z.string().optional(),
  estimatedArrivalDate: z.string().optional(),
});

export const CartItemSchema = BookSchema.extend({
  quantity: z.number().int().positive(),
});

export const OrderSchema = z.object({
  id: z.string(),
  date: z.string(),
  status: z.enum(['Processing', 'Pending Ingram', 'Ingram Confirmed', 'Shipped', 'Delivered', 'Cancelled']),
  total: z.number().nonnegative(),
  items: z.array(CartItemSchema),
  shippingMethod: z.string(),
  customerEmail: z.string().email(),
  customerAddress: z.string().min(1),
  trackingNumber: z.string().optional(),
  fulfillmentSource: z.enum(['local', 'ingram']),
});

export const CheckoutSessionRequestSchema = z.object({
  priceId: z.string().min(1),
  mode: z.enum(['payment', 'subscription']).default('payment'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const ShippingInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
});

export const PaymentInfoSchema = z.object({
  cardNumber: z.string().regex(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, 'Invalid card number'),
  cardName: z.string().min(1, 'Name on card is required'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry date (MM/YY)'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC'),
});

export const ISBNSchema = z.string().refine(
  (val) => {
    const cleaned = val.replace(/[-\s]/g, '');
    return cleaned.length === 10 || cleaned.length === 13;
  },
  { message: 'ISBN must be 10 or 13 digits' }
);

export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  genre: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  format: z.array(z.enum(['Hardcover', 'Paperback', 'Mass Market', 'Other'])).optional(),
  condition: z.array(z.enum(['New', 'Like New', 'Very Good', 'Good', 'Acceptable'])).optional(),
  sortBy: z.enum(['relevance', 'price-asc', 'price-desc', 'title-asc', 'title-desc', 'newest']).optional(),
});

/**
 * Normalize ISBN to standard format (remove hyphens, convert ISBN-10 to ISBN-13 if needed)
 */
export function normalizeISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, '');
}

/**
 * Validate and parse ISBN
 */
export function validateISBN(isbn: string): { valid: boolean; normalized: string; error?: string } {
  try {
    const normalized = normalizeISBN(isbn);
    if (normalized.length === 10 || normalized.length === 13) {
      return { valid: true, normalized };
    }
    return { valid: false, normalized, error: 'ISBN must be 10 or 13 digits' };
  } catch {
    return { valid: false, normalized: isbn, error: 'Invalid ISBN format' };
  }
}

