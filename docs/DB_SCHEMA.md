# Database Schema Documentation

This document describes the actual Supabase database schema as discovered from generated types.

**Generated from:** `types/supabase.ts`  
**Last Updated:** Generated via `npm run db:types`

---

## Tables

### `books`

**Columns:**
- `id` (string, UUID, primary key)
- `created_at` (string, timestamp)
- `updated_at` (string, timestamp)
- `title` (string, required)
- `author` (string, nullable)
- `description` (string, nullable)
- `cover_url` (string, nullable)
- `isbn13` (string, nullable)
- `isbn10` (string, nullable)
- `publisher` (string, nullable)
- `publication_date` (string, nullable, date)
- `language` (string, nullable)
- `page_count` (number, nullable, integer)
- `format` (string, nullable) - e.g., "Hardcover", "Paperback", "Mass Market", "Other"
- `list_price_cents` (number, nullable, integer) - Price in cents
- `currency` (string, nullable) - e.g., "USD"
- `availability_message` (string, nullable) - e.g., "In stock & ready to ship"
- `estimated_arrival_date` (string, nullable, date)
- `is_active` (boolean, default true) - Only active books shown in public catalog

**Relationships:**
- Referenced by: `cart_items`, `wishlist_items`, `order_items`

**Notes:**
- No `genre`, `stock`, `tags`, `condition`, `location`, `binding`, `published_date` fields
- Use `format` instead of `binding`
- Use `publication_date` instead of `published_date`
- Use `list_price_cents` instead of `price` (numeric)
- Always filter by `is_active = true` for public catalog

---

### `cart_items`

**Columns:**
- `id` (string, UUID, primary key)
- `created_at` (string, timestamp)
- `updated_at` (string, timestamp)
- `user_id` (string, UUID, required) - Foreign key to `auth.users`
- `book_id` (string, UUID, required) - Foreign key to `books.id`
- `quantity` (number, required, integer)

**Relationships:**
- `book_id` → `books.id` (many-to-one)

**RLS Notes:**
- Users can only access their own cart items (scoped by `user_id`)

---

### `wishlist_items`

**Columns:**
- `id` (string, UUID, primary key)
- `created_at` (string, timestamp)
- `user_id` (string, UUID, required) - Foreign key to `auth.users`
- `book_id` (string, UUID, required) - Foreign key to `books.id`

**Relationships:**
- `book_id` → `books.id` (many-to-one)

**RLS Notes:**
- Users can only access their own wishlist items (scoped by `user_id`)

---

### `orders`

**Columns:**
- `id` (string, UUID, primary key)
- `created_at` (string, timestamp)
- `user_id` (string, UUID, nullable) - Foreign key to `auth.users` (null for guest orders)
- `status` (string, required) - e.g., "created", "processing", "shipped", "delivered", "cancelled"
- `currency` (string, nullable) - e.g., "USD"
- `subtotal_cents` (number, nullable, integer) - Subtotal in cents
- `tax_cents` (number, nullable, integer) - Tax in cents (default 0)
- `shipping_cents` (number, nullable, integer) - Shipping in cents (default 0)
- `total_cents` (number, nullable, integer) - Total in cents
- `stripe_checkout_session_id` (string, nullable) - Stripe session ID
- `stripe_payment_intent_id` (string, nullable) - Stripe payment intent ID
- `email` (string, nullable) - Customer email

**Relationships:**
- Referenced by: `order_items`

**Notes:**
- No `date`, `items`, `shipping_method`, `customer_address`, `tracking_number`, `fulfillment_source` fields
- Use `created_at` for order date
- Use `order_items` table for order line items
- Stripe integration fields are present but not used yet

---

### `order_items`

**Columns:**
- `id` (string, UUID, primary key)
- `created_at` (string, timestamp)
- `order_id` (string, UUID, required) - Foreign key to `orders.id`
- `book_id` (string, UUID, nullable) - Foreign key to `books.id` (nullable in case book is deleted)
- `title` (string, required) - Snapshot of book title at time of order
- `unit_price_cents` (number, required, integer) - Price per unit in cents at time of order
- `quantity` (number, required, integer)

**Relationships:**
- `order_id` → `orders.id` (many-to-one)
- `book_id` → `books.id` (many-to-one, nullable)

**Notes:**
- Title and price are snapshots (don't change if book price changes later)
- `book_id` is nullable to handle deleted books gracefully

---

### `profiles`

**Columns:**
- `id` (string, UUID, primary key) - Foreign key to `auth.users.id`
- `created_at` (string, timestamp)
- `email` (string, nullable)
- `full_name` (string, nullable)

**Relationships:**
- `id` → `auth.users.id` (one-to-one)

**Notes:**
- Minimal profile structure
- Use `auth.users` for authentication, `profiles` for additional user data

---

## Field Mapping (Old → New)

| Old Field (camelCase) | New Field (snake_case) | Notes |
|----------------------|------------------------|-------|
| `price` | `list_price_cents` | Convert to cents for display |
| `binding` | `format` | Same values |
| `publishedDate` | `publication_date` | Date field |
| `availabilityMessage` | `availability_message` | Same |
| `estimatedArrivalDate` | `estimated_arrival_date` | Date field |
| `genre` | ❌ **REMOVED** | No longer in schema |
| `stock` | ❌ **REMOVED** | No longer in schema |
| `tags` | ❌ **REMOVED** | No longer in schema |
| `condition` | ❌ **REMOVED** | No longer in schema |
| `location` | ❌ **REMOVED** | No longer in schema |
| `supplySource` | ❌ **REMOVED** | No longer in schema |

---

## Query Patterns

### Fetch active books
```typescript
supabase
  .from('books')
  .select('*')
  .eq('is_active', true)
```

### Fetch cart with book details
```typescript
supabase
  .from('cart_items')
  .select('id, quantity, book_id, books(*)')
  .eq('user_id', user.id)
```

### Fetch wishlist with book details
```typescript
supabase
  .from('wishlist_items')
  .select('id, book_id, books(*)')
  .eq('user_id', user.id)
```

### Create order with items
```typescript
// 1. Create order
const { data: order } = await supabase
  .from('orders')
  .insert({
    user_id: user?.id || null,
    status: 'created',
    currency: 'USD',
    subtotal_cents: subtotal,
    tax_cents: 0,
    shipping_cents: 0,
    total_cents: total,
    email: email || null
  })
  .select()
  .single();

// 2. Create order items
await supabase
  .from('order_items')
  .insert(
    items.map(item => ({
      order_id: order.id,
      book_id: item.book_id,
      title: item.title,
      unit_price_cents: item.unit_price_cents,
      quantity: item.quantity
    }))
  );
```

---

## RLS (Row Level Security) Assumptions

- **books**: Public read access for `is_active = true` books
- **cart_items**: Users can only read/write their own items (`user_id = auth.uid()`)
- **wishlist_items**: Users can only read/write their own items (`user_id = auth.uid()`)
- **orders**: Users can only read their own orders (`user_id = auth.uid()` or guest orders by email)
- **order_items**: Accessible via order relationship (users can read items for their orders)
- **profiles**: Users can read/update their own profile (`id = auth.uid()`)

**Note:** These are assumptions. Actual RLS policies should be verified in Supabase dashboard.




