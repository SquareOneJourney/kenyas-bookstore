# Row Level Security (RLS) Testing Guide

This document outlines manual test steps to verify that Row Level Security (RLS) policies are correctly configured in Supabase.

## Prerequisites

- Two test user accounts (User A and User B)
- Access to Supabase dashboard to verify RLS policies
- Browser developer tools to inspect network requests

---

## Test 1: Public Books Access

### As Logged-Out User

**Steps:**
1. Open the application in an incognito/private window
2. Navigate to `/catalog` or homepage
3. Verify books are displayed

**Expected Result:**
- ✅ Books where `is_active = true` are visible
- ✅ Books where `is_active = false` are NOT visible
- ✅ No authentication errors in console

**Verification:**
- Check network tab: `GET /rest/v1/books?is_active=eq.true` should return 200
- Verify only active books appear in the UI

---

## Test 2: Cart Items Access

### As User A (Logged In)

**Steps:**
1. Sign in as User A
2. Add items to cart
3. Open browser DevTools → Network tab
4. Refresh the page
5. Check the cart items request

**Expected Result:**
- ✅ Only User A's cart items are returned
- ✅ Request includes `user_id=eq.<user-a-id>` filter
- ✅ Cart persists across page refreshes

**Verification:**
- Network request: `GET /rest/v1/cart_items?user_id=eq.<user-a-id>`
- Response should only contain items where `user_id` matches User A's ID

### As User B (Different User)

**Steps:**
1. Sign out as User A
2. Sign in as User B
3. Navigate to cart
4. Check cart items

**Expected Result:**
- ✅ User B sees their own cart (empty if no items)
- ✅ User B cannot see User A's cart items
- ✅ No errors in console

**Verification:**
- Network request should filter by User B's `user_id`
- No cart items from User A should appear

---

## Test 3: Wishlist Items Access

### As User A

**Steps:**
1. Sign in as User A
2. Add books to wishlist
3. Refresh page
4. Check wishlist items request

**Expected Result:**
- ✅ Only User A's wishlist items are returned
- ✅ Request includes `user_id=eq.<user-a-id>` filter

**Verification:**
- Network request: `GET /rest/v1/wishlist_items?user_id=eq.<user-a-id>`
- Response should only contain items where `user_id` matches User A's ID

### As User B

**Steps:**
1. Sign in as User B
2. Navigate to wishlist
3. Verify User B cannot see User A's wishlist

**Expected Result:**
- ✅ User B sees only their own wishlist
- ✅ No items from User A appear

---

## Test 4: Orders Access

### As User A

**Steps:**
1. Sign in as User A
2. Place an order (complete checkout)
3. Check order history (if implemented)

**Expected Result:**
- ✅ User A can see their own orders
- ✅ Orders are scoped by `user_id`

**Verification:**
- Network request: `GET /rest/v1/orders?user_id=eq.<user-a-id>`
- Only User A's orders should be returned

### As User B

**Steps:**
1. Sign in as User B
2. Attempt to access User A's orders (if order history page exists)

**Expected Result:**
- ✅ User B cannot see User A's orders
- ✅ User B only sees their own orders

---

## Test 5: Guest Cart (localStorage)

### As Logged-Out User

**Steps:**
1. Open application in incognito window
2. Add items to cart
3. Check localStorage

**Expected Result:**
- ✅ Cart items stored in localStorage
- ✅ No Supabase requests for cart items
- ✅ Cart persists across page refreshes (same browser)

**Verification:**
- Check Application → Local Storage → `kenyas-bookstore-cart`
- Should contain cart items as JSON

---

## Test 6: Cart Merge on Login

### Steps:
1. As logged-out user, add items to cart (localStorage)
2. Sign in as User A
3. Check cart after login

**Expected Result:**
- ✅ localStorage cart items are merged into DB cart
- ✅ Quantities are added if same book exists in both
- ✅ localStorage cart is cleared after merge
- ✅ Cart items persist in DB after refresh

**Verification:**
- Check network tab for `POST /rest/v1/cart_items` (upsert operations)
- Check localStorage is cleared after merge
- Refresh page and verify cart items still exist (from DB)

---

## Test 7: Inactive Books Filtering

### Steps:
1. In Supabase dashboard, set a book's `is_active` to `false`
2. Refresh the catalog page
3. Search for that book

**Expected Result:**
- ✅ Inactive book does NOT appear in catalog
- ✅ Inactive book does NOT appear in search results
- ✅ Inactive book can still be accessed via direct URL (if needed for admin)

**Verification:**
- Network request: `GET /rest/v1/books?is_active=eq.true`
- Inactive book should not be in response

---

## Test 8: Order Creation

### As User A

**Steps:**
1. Sign in as User A
2. Add items to cart
3. Complete checkout
4. Check Supabase dashboard for new order

**Expected Result:**
- ✅ Order created with `user_id = User A's ID`
- ✅ Order status = 'created'
- ✅ Order totals are correct (subtotal, tax, shipping, total in cents)
- ✅ Order items created with correct book_id, title, unit_price_cents, quantity

**Verification:**
- Check `orders` table: new row with User A's `user_id`
- Check `order_items` table: rows with matching `order_id`
- Verify `total_cents` matches calculated total

### As Guest

**Steps:**
1. As logged-out user, add items to cart
2. Complete checkout as guest (enter email)
3. Check Supabase dashboard

**Expected Result:**
- ✅ Order created with `user_id = null`
- ✅ Order email matches entered email
- ✅ Order items created correctly

---

## RLS Policy Assumptions

Based on the application's behavior, the following RLS policies are assumed:

### Books
```sql
-- Public read access for active books
CREATE POLICY "Public can read active books"
ON books FOR SELECT
USING (is_active = true);
```

### Cart Items
```sql
-- Users can only access their own cart items
CREATE POLICY "Users can manage own cart items"
ON cart_items FOR ALL
USING (auth.uid() = user_id);
```

### Wishlist Items
```sql
-- Users can only access their own wishlist items
CREATE POLICY "Users can manage own wishlist items"
ON wishlist_items FOR ALL
USING (auth.uid() = user_id);
```

### Orders
```sql
-- Users can only read their own orders
CREATE POLICY "Users can read own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can create orders (for themselves or as guest)
CREATE POLICY "Users can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

### Order Items
```sql
-- Users can read order items for their orders
CREATE POLICY "Users can read own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);
```

---

## Troubleshooting

### Issue: Cart items not persisting
- **Check:** RLS policy allows INSERT/UPDATE for authenticated users
- **Check:** `user_id` is correctly set in cart_items

### Issue: Books not loading
- **Check:** RLS policy allows SELECT for public
- **Check:** Query includes `is_active=eq.true` filter

### Issue: Cannot create orders
- **Check:** RLS policy allows INSERT on orders table
- **Check:** `user_id` is set correctly (null for guests)

---

## Notes

- These tests should be run after any RLS policy changes
- RLS policies should be verified in Supabase dashboard under Authentication → Policies
- If policies differ from assumptions, update this document accordingly

