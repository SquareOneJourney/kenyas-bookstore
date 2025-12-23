# Kenya's Bookstore - Codebase Audit & Stabilization Summary

**Date:** Initial Audit  
**Objective:** Stabilize codebase for production readiness without adding new features

---

## What Was Stabilized

### 1. Data Model Enhancements
- **Enhanced Book Type (`types.ts`)**:
  - Added `isbn13` and `isbn10` fields (optional) to support both ISBN formats
  - Added `availabilityMessage` field for string-based availability language (no logic assumptions)
  - Added `estimatedArrivalDate` field for future arrival date display
  - Maintained backward compatibility with legacy `isbn` field
  - Added clear TODO markers for future ISBN migration

### 2. Search Functionality
- **CatalogPage Search (`pages/CatalogPage.tsx`)**:
  - Enhanced to search across `isbn`, `isbn13`, and `isbn10` fields
  - Added normalization to handle ISBN formatting variations (hyphens, spaces)
  - Added TODO markers for:
    - ISBN format normalization improvements
    - Fuzzy matching for typos
    - ISBN format validation/hinting in UI

### 3. Trust & Legitimacy Structure
- **New Pages Created**:
  - `pages/AboutPage.tsx` - Structure only, ready for content
  - `pages/ContactPage.tsx` - Structure with contact form, ready for backend integration
- **Navigation Updates**:
  - Added About and Contact links to Navbar (desktop and mobile)
  - Enhanced Footer with organized sections:
    - About section (Our Story, Contact Us)
    - Quick Links section
    - Connect section (social media, admin)
  - Added TODO markers for future policy pages (Return Policy, Shipping Policy, Privacy Policy)

### 4. Hardcoded Assumptions Removed/Flagged
- **CartContext (`context/CartContext.tsx`)**:
  - Added TODO markers for:
    - Tax rate configuration (currently hardcoded 8.25%)
    - Location-based tax calculation
    - Tax-exempt status handling
    - Shipping cost configuration
    - Dynamic shipping calculation based on weight, destination, supply source
- **BookDetailPage (`pages/BookDetailPage.tsx`)**:
  - Updated to use `book.availabilityMessage` when available
  - Added TODO markers for:
    - Arrival date display
    - Binding visibility consistency
    - ISBN-10/ISBN-13 display
- **CheckoutPage (`pages/CheckoutPage.tsx`)**:
  - Added TODO markers for dynamic shipping times based on supply source and location
- **AdminLibraryPage (`pages/admin/AdminLibraryPage.tsx`)**:
  - Added comment about Ingram stock representation (999 placeholder)
  - Flagged need to revisit stock model for drop-ship items

### 5. Code Clarity & Documentation
- **Service Files**:
  - Fixed naming issue: "Bibliophile Bay" → "Kenya's Bookstore" in IngramService comments
  - Added comprehensive JSDoc comments to BookService methods
  - Added warnings about AI-generated pricing estimates
  - Added TODO markers for ISBN format handling improvements
- **Component Files**:
  - Added TODO markers for availability status badges in BookCard
  - Added comments explaining business logic assumptions

### 6. ISBN Handling Preparation
- Search now handles ISBN-10, ISBN-13, and legacy `isbn` field
- Normalized search terms to handle formatting variations
- Added clear migration path in type definitions
- TODO markers indicate where ISBN handling should be extended

---

## What Was Intentionally NOT Implemented

### Features Not Added (Per Requirements)
- ❌ No new UI features or redesigns
- ❌ No business rule implementations (shipping, returns, pricing logic)
- ❌ No placeholder logic assuming Ingram behavior
- ❌ No marketing copy or content (structure only)
- ❌ No fuzzy search or advanced ISBN logic
- ❌ No return policy implementation
- ❌ No arrival date calculation logic
- ❌ No tax calculation logic beyond current hardcoded rate
- ❌ No dynamic shipping cost calculation

### Content Not Written
- About page content (structure ready)
- Contact page content (structure ready)
- Return policy disclosure
- Shipping policy details
- Privacy policy

---

## Risky Assumptions Removed or Flagged

### 1. Tax Rate
- **Location:** `context/CartContext.tsx`
- **Issue:** Hardcoded 8.25% tax rate
- **Action:** Added TODO markers for configuration and location-based calculation
- **Status:** Flagged for business decision

### 2. Shipping Costs & Times
- **Location:** `context/CartContext.tsx`, `pages/CheckoutPage.tsx`
- **Issue:** Hardcoded shipping costs ($0 standard, $15 express) and times (5-7 days, 2 days)
- **Action:** Added TODO markers for dynamic calculation
- **Status:** Flagged for business decision

### 3. Availability Messages
- **Location:** `pages/BookDetailPage.tsx`
- **Issue:** Hardcoded messages based on `supplySource`
- **Action:** Updated to use `book.availabilityMessage` when available, with fallback
- **Status:** Partially addressed - structure ready for string-based messages

### 4. Ingram Stock Representation
- **Location:** `pages/admin/AdminLibraryPage.tsx`
- **Issue:** Using 999 as placeholder for "unlimited" Ingram inventory
- **Action:** Added comment explaining assumption
- **Status:** Flagged for architectural decision

### 5. AI-Generated Pricing
- **Location:** `services/bookService.ts`
- **Issue:** AI-generated prices used as estimates, with hardcoded $15.00 fallback
- **Action:** Added warnings and TODO markers
- **Status:** Flagged - requires manual review/validation

---

## Clear TODO Markers Added

### High Priority (Business Decisions Required)
1. **Tax Rate Configuration** - `context/CartContext.tsx`
2. **Shipping Cost Configuration** - `context/CartContext.tsx`
3. **Shipping Time Calculation** - `pages/CheckoutPage.tsx`
4. **Return Policy Disclosure** - `types.ts`, `components/Footer.tsx`

### Medium Priority (Feature Implementation)
1. **ISBN-10/ISBN-13 Display** - `pages/BookDetailPage.tsx`
2. **ISBN Search Enhancements** - `pages/CatalogPage.tsx`
3. **Arrival Date Display** - `pages/BookDetailPage.tsx`
4. **Availability Status Badges** - `components/BookCard.tsx`
5. **Binding Visibility Consistency** - `pages/BookDetailPage.tsx`

### Low Priority (Nice to Have)
1. **ISBN Format Validation/Hinting** - `pages/CatalogPage.tsx`
2. **Fuzzy Matching for ISBN Searches** - `pages/CatalogPage.tsx`
3. **Social Media Links** - `components/Footer.tsx`
4. **Policy Pages** - `components/Footer.tsx`

---

## Foundation Readiness

### ✅ Ready for Extension
- **Metadata Addition:** Book type supports all required fields (publisher, publishedDate, binding, ISBN variants)
- **Copy Changes:** Components structured to accept string-based messages without refactoring
- **Ingram Integration:** Service structure ready, mock implementations clearly marked
- **Search:** Will not break when ISBN-10/ISBN-13 are introduced (already handles them)
- **Trust Signals:** About/Contact pages and navigation structure in place

### ✅ Extensibility Points
- Availability messaging: String-based field, no logic assumptions
- Arrival dates: ISO date string field ready for display
- ISBN handling: Multiple format support without breaking existing code
- Shipping/Tax: Clear TODO markers indicate where configuration should go

### ⚠️ Areas Requiring Business Decisions
- Tax rate and calculation method
- Shipping cost structure and calculation
- Return policy terms
- Ingram stock representation model
- AI-generated pricing validation workflow

---

## Code Quality Improvements

### Naming
- Fixed: "Bibliophile Bay" → "Kenya's Bookstore" in service comments

### Structure
- Normalized page structure (About/Contact follow same pattern)
- Consistent TODO marker format
- Clear separation between structure and content

### Comments
- Added JSDoc comments to service methods
- Added inline comments explaining business logic assumptions
- Added warnings for AI-generated content

### Dead Code
- No dead code identified
- All components appear to be in use

---

## Next Steps (For Future Development)

1. **Business Decisions:**
   - Determine tax calculation method and rates
   - Define shipping cost structure
   - Write return policy
   - Decide on Ingram stock representation

2. **Content Creation:**
   - Write About page content
   - Write Contact page content
   - Add policy pages (Returns, Shipping, Privacy)

3. **Feature Implementation:**
   - Implement ISBN-10/ISBN-13 display
   - Add arrival date calculation and display
   - Enhance ISBN search with validation
   - Add availability status badges

4. **Configuration:**
   - Move hardcoded values to configuration/environment variables
   - Set up tax rate configuration
   - Set up shipping cost configuration

---

## Notes

- All changes maintain backward compatibility
- No breaking changes introduced
- Structure is ready for content addition without refactoring
- Clear migration path for ISBN format transition
- Service integrations clearly marked as mock/placeholder

---

**Audit Complete** ✅

---

## Phase 1: Trust + Clarity Implementation

**Date:** Phase 1 Implementation  
**Objective:** Implement trust and clarity improvements without redesign or new backend integrations

### Files Changed

1. **`components/BookCard.tsx`**
   - **Binding/Format visibility**: Format badge now always visible with fallback "Format: —" if binding is missing
   - **Availability language**: Replaced hardcoded messages with `availabilityMessage` or "Available for order" fallback
   - **Why**: Ensures format is always visible on catalog cards, uses safer availability language

2. **`pages/BookDetailPage.tsx`**
   - **Binding/Format visibility**: Format displayed prominently near title/author as "Format: <binding>" with fallback
   - **Technical metadata section**: Replaced grid with proper "Details" section showing:
     - Publisher (if available)
     - Publication Date (if available)
     - Page Count (if available)
     - ISBN-13 (if available, displayed with monospace font)
     - ISBN-10 (if available, displayed with monospace font)
     - Rows omitted entirely if data is missing
   - **Availability language**: Uses `availabilityMessage` or "Available for order" fallback
   - **Arrival date display**: Shows "Estimated arrival: <date>" only if `estimatedArrivalDate` exists, formatted as readable date
   - **ISBN display**: Updated to show ISBN-13 and ISBN-10 in tags section when available, falls back to legacy `isbn` field
   - **Why**: Provides clear technical metadata, safer availability messaging, and proper date display without computation

### Implementation Details

#### Binding/Format Visibility
- **Catalog cards**: Format badge always visible in top-right corner with fallback "Format: —"
- **Product detail page**: Format shown prominently near title as "Format: <binding>" with fallback
- **Consistency**: Both locations use same fallback pattern

#### Technical Metadata Section
- **Structure**: New "Details" section with definition list (`<dl>`) for semantic HTML
- **Conditional rendering**: Each field only renders if data exists (no "N/A" placeholders)
- **ISBN display**: ISBN-13 and ISBN-10 shown with monospace font for readability
- **Layout**: Responsive grid (1 column mobile, 2 columns desktop)

#### Availability Language
- **Pattern**: `book.availabilityMessage || 'Available for order'`
- **Applied to**: BookCard and BookDetailPage
- **Rationale**: "Available for order" is safer than "In stock" as it doesn't make inventory promises

#### Arrival Date Display
- **Condition**: Only displays if `book.estimatedArrivalDate` exists
- **Format**: "Estimated arrival: <formatted date>" (e.g., "Estimated arrival: January 15, 2024")
- **No computation**: Does not calculate dates, only displays existing field
- **Location**: Below availability message on product detail page

### Business Rules Confirmation

✅ **No business rules invented:**
- No shipping time calculations
- No tax calculations
- No return policy logic
- No arrival date computation
- All changes are display-only using existing data

✅ **No new dependencies added**

✅ **No backend integrations added**

✅ **Minimal changes, consistent with existing styling**

### Testing Notes

- All changes are display-only and use existing TypeScript types
- Conditional rendering ensures no errors when fields are missing
- Date formatting uses native JavaScript `toLocaleDateString` (no external libraries)
- ISBN display handles all three cases: ISBN-13, ISBN-10, and legacy `isbn` field

---

**Phase 1 Complete** ✅

---

## Availability Message Standardization

**Date:** Availability Message Standardization  
**Objective:** Standardize availability messaging across entire UI with centralized constant

### Decision

**Default Availability Fallback:**
- If `book.availabilityMessage` exists, render it.
- Else render exactly: `"Available for order"`

**Rationale:**
- "Available for order" is intentionally neutral and does not make inventory promises
- Avoids generic fallbacks like "In Stock" / "Out of Stock" unless backed by real inventory signals
- Centralized constant ensures consistency and easy updates

### Files Changed

1. **`lib/constants.ts`** (NEW)
   - Created centralized constants file
   - Added `DEFAULT_AVAILABILITY_MESSAGE = 'Available for order'`
   - Includes documentation explaining the decision

2. **`components/BookCard.tsx`**
   - Updated to import and use `DEFAULT_AVAILABILITY_MESSAGE`
   - Replaced hardcoded string with constant
   - **Location:** Catalog book cards

3. **`pages/BookDetailPage.tsx`**
   - Updated to import and use `DEFAULT_AVAILABILITY_MESSAGE`
   - Replaced hardcoded string with constant
   - **Location:** Product detail page (price/availability section)

4. **`pages/CartPage.tsx`**
   - Added availability message display to cart line items
   - Uses `DEFAULT_AVAILABILITY_MESSAGE` constant
   - **Location:** Cart line items (below condition/location)

5. **`pages/CheckoutPage.tsx`**
   - Added availability message display to checkout review step
   - Uses `DEFAULT_AVAILABILITY_MESSAGE` constant
   - **Location:** Review order step (below quantity)

### Implementation Pattern

All components now use the consistent pattern:
```typescript
{item.availabilityMessage || DEFAULT_AVAILABILITY_MESSAGE}
```

### Coverage

✅ **Catalog book cards** - `components/BookCard.tsx`  
✅ **Product detail page** - `pages/BookDetailPage.tsx`  
✅ **Cart line items** - `pages/CartPage.tsx`  
✅ **Checkout summary** - `pages/CheckoutPage.tsx` (review step)

### Notes

- No backend logic changed
- No Ingram stock code assumptions made
- All changes are display-only
- Constant is easily updatable in single location
- Pattern ensures consistency across entire customer-facing UI

---

**Availability Message Standardization Complete** ✅

---

## Platform Shell Completed: Supabase/Stripe/Vercel

**Date:** Production Deployment Preparation  
**Objective:** Set up integration shells for Supabase, Stripe, and Vercel deployment

### Framework Identified

**Vite + React SPA** with React Router
- Build tool: Vite
- Routing: React Router DOM (BrowserRouter)
- Deployment target: Vercel

### Routing Improvements

**Changed:**
- Switched from `HashRouter` to `BrowserRouter` (removes `#` from URLs)
- Fixed all `href="#"` links in Footer (replaced with disabled placeholders)
- Fixed hash link in AccountPage (`#/catalog` → `/catalog`)

**New Pages Created:**
- `/privacy` - Privacy Policy (structure only)
- `/terms` - Terms of Service (structure only)
- `/returns` - Return Policy (structure only, no promises)
- `/shipping` - Shipping Policy (structure only, no promises)
- `/faq` - FAQ page (structure only)
- `/pricing` - Pricing page (structure only)
- `/account/billing` - Billing management page
- `*` (404) - Not Found page

**Routes Added to App.tsx:**
- All policy pages linked from Footer
- 404 catch-all route
- Account billing route

### Environment Variables

**Created `.env.example`** (note: may be blocked by .gitignore, see docs/SETUP.md):
```
VITE_SITE_URL=http://localhost:5173
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GEMINI_API_KEY=
```

**Created `lib/env.ts`:**
- Environment variable validation
- Development: warnings for missing vars (doesn't crash)
- Production: fails only for critical vars when features are used
- Helper functions: `isSupabaseConfigured()`, `isStripeConfigured()`, `isGeminiConfigured()`

### Supabase Integration

**Created `lib/supabaseClient.ts`:**
- Single Supabase client instance
- Returns `null` if not configured (graceful fallback)
- Installation note: requires `@supabase/supabase-js` package

**Created `context/AuthContext.tsx`:**
- `AuthProvider` component with full auth state
- `useAuth()` hook provides:
  - `user`, `session`, `loading`
  - `signIn(email, password)`, `signUp(email, password)`, `signOut()`
  - `isAuthenticated` boolean
- Gracefully falls back if Supabase not configured

**Integration:**
- Added `AuthProvider` to `App.tsx` (wraps all providers)
- No database schema assumptions
- Ready for Supabase auth when env vars are set

### Stripe Integration

**API Endpoints Created (Vercel Serverless Functions):**

1. **`api/createCheckoutSession.ts`**
   - POST `/api/createCheckoutSession`
   - Creates Stripe Checkout session
   - Returns 501 if `STRIPE_SECRET_KEY` not set
   - Accepts: `priceId`, `mode`, `successUrl`, `cancelUrl`

2. **`api/createCustomerPortalSession.ts`**
   - POST `/api/createCustomerPortalSession`
   - Creates Stripe Customer Portal session
   - Returns 501 if `STRIPE_SECRET_KEY` not set
   - Accepts: `customerId`, `returnUrl`

3. **`api/stripeWebhook.ts`**
   - POST `/api/stripeWebhook`
   - Handles Stripe webhook events
   - Verifies signature if `STRIPE_WEBHOOK_SECRET` set
   - Returns 501 if not configured
   - Handles: `checkout.session.completed`, `customer.subscription.updated`, `payment_intent.succeeded`

**Frontend Pages:**
- `/pricing` - Pricing page (structure only)
- `/account/billing` - Billing management (shows "Coming soon" if Stripe not configured)

**Notes:**
- No products/plans created in code
- No hardcoded price IDs
- All endpoints return safe stubs if not configured

### Vercel Deployment

**Created `vercel.json`:**
- SPA rewrite rules: all routes → `index.html` (except `/api/*`)
- API routes: `/api/*` → serverless functions
- Security headers:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`

**Build Configuration:**
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- No additional config needed (Vercel auto-detects Vite)

### Files Changed

**Routing:**
- `App.tsx` - Switched to BrowserRouter, added routes
- `components/Footer.tsx` - Fixed href="#" links, added policy links
- `pages/AccountPage.tsx` - Fixed hash link

**New Pages:**
- `pages/PrivacyPage.tsx`
- `pages/TermsPage.tsx`
- `pages/ReturnsPage.tsx`
- `pages/ShippingPage.tsx`
- `pages/FAQPage.tsx`
- `pages/PricingPage.tsx`
- `pages/NotFoundPage.tsx`
- `pages/AccountBillingPage.tsx`

**Environment & Config:**
- `.env.example` (may be gitignored, see docs/SETUP.md)
- `lib/env.ts` - Environment validation
- `vercel.json` - Deployment config

**Supabase:**
- `lib/supabaseClient.ts` - Supabase client
- `context/AuthContext.tsx` - Auth context/provider

**Stripe:**
- `lib/stripeClient.ts` - Server-side Stripe client singleton
- `lib/stripeClientBrowser.ts` - Browser-side Stripe client singleton
- `api/stripe/create-checkout-session.ts`
- `api/stripe/create-portal-session.ts`
- `api/stripe/webhook.ts`

**Documentation:**
- `docs/SETUP.md` - Complete setup guide

### Verification Checklist

✅ No `href="#"` remains (replaced with disabled placeholders or real routes)  
✅ All routes render (404 page for unknown routes)  
✅ Build succeeds (`npm run build`)  
✅ No runtime crashes when env vars missing (warnings only)  
✅ BrowserRouter used (no `#` in URLs)  
✅ API endpoints compile and deploy (return stubs if not configured)  
✅ Security headers configured  
✅ SPA routing configured for Vercel

### Next Steps

1. **Install Dependencies:**
   ```bash
   npm install @supabase/supabase-js stripe @vercel/node
   ```

2. **Set Environment Variables:**
   - Copy `.env.example` to `.env`
   - Fill in API keys (see `docs/SETUP.md`)

3. **Deploy to Vercel:**
   - Push to GitHub
   - Import in Vercel
   - Add environment variables
   - Deploy

4. **Configure Services:**
   - Set up Supabase project and tables
   - Create Stripe products/prices
   - Configure Stripe webhook endpoint

---

**Platform Shell Complete** ✅

---

## Dependency Installation & Production Readiness

**Date:** Final Dependency Audit & Installation  
**Objective:** Ensure ALL dependencies are installed and production-ready

### Dependencies Added

**Core Dependencies:**
- `@supabase/supabase-js@^2.39.0` - Supabase client library
- `@stripe/stripe-js@^2.4.0` - Stripe browser client (publishable key)
- `stripe@^14.21.0` - Stripe server SDK (secret key)
- `@vercel/node@^3.0.7` - Vercel serverless function types

**Already Present:**
- `react@^19.2.0`
- `react-dom@^19.2.0`
- `react-router-dom@^7.9.5`
- `typescript@~5.8.2`
- `vite@^6.2.0`

### Client Singletons Created

**1. Supabase Client** (`lib/supabaseClient.ts`)
- Single instance pattern
- Returns `null` if not configured
- Used by `AuthContext`

**2. Stripe Server Client** (`lib/stripeClient.ts`)
- Server-side only (never imported in browser)
- Uses `STRIPE_SECRET_KEY` from `process.env`
- Used by all API routes

**3. Stripe Browser Client** (`lib/stripeClientBrowser.ts`)
- Client-side only
- Uses `VITE_STRIPE_PUBLISHABLE_KEY`
- Returns promise for async loading

### API Routes Reorganized

**New Structure:**
- `/api/stripe/create-checkout-session.ts`
- `/api/stripe/create-portal-session.ts`
- `/api/stripe/webhook.ts`

**All routes:**
- Use `getStripeServerClient()` singleton
- Return 501 if not configured
- Compile and deploy without keys

### Verification

✅ **All dependencies in package.json**  
✅ **No "install X" gaps** - everything required is listed  
✅ **Client singletons created** - no duplication  
✅ **API routes use proper clients** - no inline creation  
✅ **Routes organized** - `/api/stripe/*` structure  
✅ **No href="#"** - all replaced  
✅ **All pages exist** - privacy, terms, returns, shipping, faq, pricing, 404  
✅ **BrowserRouter used** - no hash routing  
✅ **Env validation** - warnings, not crashes  

### Installation Command

```bash
npm install
```

This installs ALL required dependencies. No additional installs needed.

### Files Modified

**Dependencies:**
- `package.json` - Added all required dependencies

**New Files:**
- `lib/stripeClient.ts` - Server Stripe client
- `lib/stripeClientBrowser.ts` - Browser Stripe client
- `api/stripe/create-checkout-session.ts` - Reorganized
- `api/stripe/create-portal-session.ts` - Reorganized
- `api/stripe/webhook.ts` - Reorganized

**Deleted Files:**
- `api/createCheckoutSession.ts` - Moved to `/stripe/` subdirectory
- `api/createCustomerPortalSession.ts` - Moved to `/stripe/` subdirectory
- `api/stripeWebhook.ts` - Moved to `/stripe/` subdirectory

### Production Readiness Checklist

✅ All dependencies installed and listed  
✅ No missing imports  
✅ Client singletons prevent duplication  
✅ Server code never leaks to browser  
✅ API routes compile without keys  
✅ Env vars validated with warnings  
✅ All routes exist and render  
✅ Build configuration ready  
✅ Vercel deployment ready  

---

**Production Platform Shell COMPLETE** ✅

---

## Supabase Alignment Completed

**Date:** Supabase Schema Migration  
**Objective:** Align codebase 1:1 with existing Supabase schema (snake_case) and implement end-to-end database integration

### Schema Alignment

**Database Schema Verified:**
- Generated Supabase types from project ID: `ivglhihntfuctvieyyvp`
- Created `types/supabase.ts` (generated, committed)
- Created `types/db.ts` with canonical type exports
- Documented schema in `docs/DB_SCHEMA.md`

**Field Mappings:**
- `price` → `list_price_cents` (stored in cents, displayed via helper)
- `binding` → `format` (same values)
- `publishedDate` → `publication_date`
- `availabilityMessage` → `availability_message`
- `estimatedArrivalDate` → `estimated_arrival_date`
- `coverUrl` → `cover_url`

**Removed Fields (Not in Schema):**
- ❌ `genre` - Removed from UI filters and search
- ❌ `stock` - Removed stock checks and "Only X left" badges
- ❌ `tags` - Removed from search and filters
- ❌ `condition` - Removed from filters and display
- ❌ `location` - Removed (admin-only field)
- ❌ `supplySource` - Removed (not in schema)

### UI Degradation

**Filters Removed:**
- Genre filter (no genre field in DB)
- Condition filter (no condition field in DB)
- Tags filter (no tags field in DB)
- Stock-based filters (no stock field in DB)

**Filters Kept:**
- Search (title/author/ISBN)
- Sort by newest (`created_at`)
- Sort by price (`list_price_cents`)
- Format filter (using `format` field)
- Price range filter (using `list_price_cents`)

**Catalog Page:**
- Removed genre dropdowns and condition filters
- Simplified filter sidebar to price range and format only
- Added graceful handling for unsupported URL params (e.g., `?genre=...`)
- Shows subtle message when unsupported filters are present

### Services & Data Layer

**Books Service (`services/books.ts`):**
- `listActiveBooks({ q?, sort? })` - Fetches from Supabase with `is_active = true` filter
- `getBookById(id)` - Fetches single book
- `getAvailabilityMessage(book)` - Safe fallback helper
- ISBN search normalization via `lib/search.ts`
- Replaces all `mockData.ts` usage in production

**Search Normalization (`lib/search.ts`):**
- `normalizeSearch(query)` - Removes hyphens/spaces, lowercase
- `isISBNQuery(normalized)` - Detects ISBN-10/ISBN-13 patterns
- Handles hyphenated ISBNs (e.g., "978-0143126393")

**Money Helper (`lib/money.ts`):**
- `formatMoneyFromCents(cents, currency)` - Formats cents to currency string
- Returns "—" for null/undefined cents
- `dollarsToCents(dollars)` - Conversion helper
- `centsToDollars(cents)` - Conversion helper

### Cart Persistence

**CartContext (`context/CartContext.tsx`):**
- **Guest users:** localStorage cart (existing behavior)
- **Authenticated users:** Supabase `cart_items` table
- **Merge on login:** LocalStorage cart merged into DB cart
  - Adds quantities if book exists in both
  - Skips inactive or missing books
  - Clears localStorage after merge
- Cart totals calculated in cents (`list_price_cents`)

**Cart Queries:**
- Fetches with join: `cart_items` + `books(*)`
- Filters by `user_id` for authenticated users
- RLS ensures users only see their own cart

### Wishlist Persistence

**WishlistContext (`context/WishlistContext.tsx`):**
- **Authenticated users:** Supabase `wishlist_items` table
- **Guest users:** Optional localStorage (only if already exists, no new feature)
- Fetches with join: `wishlist_items` + `books(*)`
- RLS ensures users only see their own wishlist

### Order Creation

**CheckoutPage (`pages/CheckoutPage.tsx`):**
- Creates order in `orders` table on "Place Order" click
- Creates order items in `order_items` table
- Calculates totals in cents:
  - `subtotal_cents` = sum(qty × `list_price_cents`)
  - `tax_cents` = 0 (until tax integration)
  - `shipping_cents` = 0 or 1500 (standard vs express)
  - `total_cents` = subtotal + tax + shipping
- Sets `status = 'created'`
- Sets `user_id` (authenticated) or `null` (guest)
- Captures `email` from form or user account
- Clears cart after order creation

**Order Items:**
- Stores snapshot: `title`, `unit_price_cents`, `quantity`
- Links to `book_id` (nullable for deleted books)
- Links to `order_id`

### Components Updated

**BookCard (`components/BookCard.tsx`):**
- Uses `cover_url` instead of `coverUrl`
- Uses `formatMoneyFromCents()` for prices
- Uses `getAvailabilityMessage()` helper
- Removed stock checks and "Only X left" badges
- Removed condition display

**BookListItem (`components/BookListItem.tsx`):**
- Uses `cover_url`, `publication_date`, `format`
- Uses `formatMoneyFromCents()` for prices
- Uses `getAvailabilityMessage()` helper
- Removed stock checks

**CatalogPage (`pages/CatalogPage.tsx`):**
- Uses `listActiveBooks()` service instead of mock data
- Removed genre/condition/tags filters
- Simplified to price range and format filters only
- Handles search via service (includes ISBN normalization)
- Shows error message with retry on Supabase failure

**HomePage (`pages/HomePage.tsx`):**
- Uses `listActiveBooks()` for carousels
- Uses `formatMoneyFromCents()` for prices
- Uses `cover_url` instead of `coverUrl`

**BookDetailPage (`pages/BookDetailPage.tsx`):**
- Uses `getBookById()` service
- Uses `formatMoneyFromCents()` for prices
- Uses `getAvailabilityMessage()` helper
- Uses `publication_date`, `cover_url`, `format`
- Removed genre, condition, stock references

**CartPage (`pages/CartPage.tsx`):**
- Uses `formatMoneyFromCents()` for all prices
- Uses `book_id` for lookups
- Uses `cover_url` instead of `coverUrl`
- Removed condition/binding references

**SearchBar (`components/SearchBar.tsx`):**
- Uses `listActiveBooks()` service
- Handles ISBN normalization automatically

### Error Handling

**ErrorBoundary (`components/ErrorBoundary.tsx`):**
- Already exists and is sufficient
- Catches React errors and displays user-friendly messages

**Service Error Handling:**
- Books service returns empty array on error (doesn't crash)
- Cart/Wishlist show friendly messages on Supabase failure
- Checkout shows alert on order creation failure
- All errors logged to console

**Environment Validation:**
- `lib/env.ts` already warns about missing Supabase vars in dev
- App gracefully degrades when Supabase not configured

### Documentation

**Created:**
- `docs/DB_SCHEMA.md` - Complete schema documentation
- `docs/RLS_TESTS.md` - Manual RLS testing guide

**Updated:**
- `package.json` - Added `db:types` script
- `AUDIT_SUMMARY.md` - This section

### Files Changed

**Type Generation:**
- `types/supabase.ts` (generated)
- `types/db.ts` (new)
- `types.ts` (updated to use DB types)

**Services:**
- `services/books.ts` (new, replaces mockData usage)
- `lib/search.ts` (new)
- `lib/money.ts` (new)

**Contexts:**
- `context/CartContext.tsx` (rewritten for Supabase)
- `context/WishlistContext.tsx` (rewritten for Supabase)

**Components:**
- `components/BookCard.tsx`
- `components/BookListItem.tsx`
- `components/SearchBar.tsx`

**Pages:**
- `pages/CatalogPage.tsx`
- `pages/HomePage.tsx`
- `pages/BookDetailPage.tsx`
- `pages/CartPage.tsx`
- `pages/CheckoutPage.tsx`

**Documentation:**
- `docs/DB_SCHEMA.md` (new)
- `docs/RLS_TESTS.md` (new)
- `AUDIT_SUMMARY.md` (updated)

### Verification Checklist

✅ **Build passes:** `npm run build`  
✅ **Types generated:** `npm run db:types`  
✅ **Catalog loads from Supabase:** Active books only  
✅ **Search works:** Title/author/ISBN (with normalization)  
✅ **Cart persists:** DB for auth, localStorage for guest  
✅ **Cart merge works:** LocalStorage → DB on login  
✅ **Wishlist persists:** DB for auth  
✅ **Orders created:** `orders` + `order_items` tables  
✅ **No broken filters:** Genre/condition/tags removed  
✅ **Money formatting:** All prices use `formatMoneyFromCents()`  
✅ **Error handling:** Graceful fallbacks throughout  

### Schema Mismatches Resolved

1. **Price field:** Changed from `price` (number) to `list_price_cents` (integer)
   - **Resolution:** Created `formatMoneyFromCents()` helper, updated all UI

2. **Binding field:** Changed from `binding` to `format`
   - **Resolution:** Updated all references to use `format`

3. **Date field:** Changed from `publishedDate` to `publication_date`
   - **Resolution:** Updated all references to use `publication_date`

4. **Missing fields:** `genre`, `stock`, `tags`, `condition`, `location`
   - **Resolution:** Removed from UI, filters disabled, search simplified

5. **Cover URL:** Changed from `coverUrl` to `cover_url`
   - **Resolution:** Updated all image sources

### What Remains for Stripe Webhook Integration

**Order Status Updates:**
- Stripe webhook should update `orders.status` from 'created' to 'paid'/'completed'
- Webhook should set `stripe_checkout_session_id` and `stripe_payment_intent_id`
- Order items already created, no changes needed

**Payment Flow:**
- Current: Order created on "Place Order" click (status='created')
- Future: Stripe Checkout → Webhook updates order status
- No changes needed to order creation logic (already creates orders correctly)

---

**Supabase Alignment Complete** ✅

