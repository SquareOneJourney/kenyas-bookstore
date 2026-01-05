# Featured Books AI Generation - Setup Guide

## Overview

The Featured Books feature allows admins to use AI (Google Gemini) to automatically recommend 5 books from Kenya's inventory to feature on the homepage. The recommendations are generated server-side for security, reviewed by the admin, and then published to automatically update the homepage.

## Architecture

### Database Schema

Two tables store featured book sets:

- **`featured_sets`**: Stores sets of featured books (e.g., "Week of 2025-01-15")
  - Only one set can be active at a time
  - Tracks who created it and when
  
- **`featured_set_items`**: Stores individual books within a set
  - Each set has exactly 5 books (display_order 1-5)
  - Stores AI reasoning for why each book was recommended

### API Endpoints (Server-Side Only)

1. **`POST /api/marketing/generate-featured-books`**
   - Fetches inventory from Supabase
   - Calls Gemini AI to recommend 5 books
   - Returns recommendations with reasoning
   - **Security**: Requires authenticated admin session

2. **`POST /api/marketing/publish-featured-books`**
   - Deactivates any existing active set
   - Creates new featured set with 5 books
   - **Security**: Requires authenticated admin session

### Frontend Components

- **Admin Marketing Page**: "AI Generate Featured Books" section
  - Generate button calls server endpoint
  - Shows 5 recommendations with book covers and AI reasoning
  - Publish button saves to database
  
- **HomePage**: Automatically displays featured books
  - Fetches active featured set on load
  - Shows primary featured book (large card)
  - Shows remaining 4 books in grid below
  - Falls back to new releases if no featured set exists

## Setup Instructions

### 1. Database Migration

Run the migration SQL in your Supabase SQL editor:

```sql
-- See: docs/migrations/001_featured_books.sql
```

This creates:
- `featured_sets` table
- `featured_set_items` table
- Indexes for performance
- RLS policies (public read, authenticated write)

### 2. Environment Variables

Ensure these are set in your Vercel project (or `.env.local` for development):

```env
# Required
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# If not set, falls back to anon key (less secure, but works)
```

**Note**: For production, you should use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations to bypass RLS when needed. The anon key works but is less ideal.

### 3. Admin Access Control

Currently, any authenticated user can generate and publish featured books. To restrict to admins only:

**Option A: Email Allowlist** (Simplest)
- Add email check in `verifyAdmin()` function in both API endpoints
- Example: `if (user.email !== 'kenya@example.com') return { isValid: false };`

**Option B: Profiles Role Column** (More Scalable)
- Add `role` column to `profiles` table
- Check `profiles.role = 'admin'` in API endpoints
- Update RLS policies to only allow admin role writes

### 4. Testing

1. **Generate Recommendations**:
   - Go to `/admin/marketing`
   - Click "Generate Featured Books"
   - Review the 5 AI recommendations

2. **Publish**:
   - Click "Publish to Homepage"
   - Verify success message

3. **Verify Homepage**:
   - Go to homepage (`/`)
   - Should see featured books section with your 5 books
   - Primary book in large card, others in grid

## How It Works

### Generation Flow

1. Admin clicks "Generate Featured Books"
2. Frontend sends POST to `/api/marketing/generate-featured-books` with auth token
3. Server:
   - Verifies admin access
   - Fetches active books from Supabase (up to 100 most recent)
   - Calls Gemini AI with inventory data
   - Gemini analyzes and returns 5 recommendations
   - Server validates book IDs exist
   - Returns recommendations to frontend

### Publishing Flow

1. Admin reviews recommendations and clicks "Publish"
2. Frontend sends POST to `/api/marketing/publish-featured-books` with:
   - Array of 5 items (book_id, display_order, ai_reasoning)
3. Server:
   - Verifies admin access
   - Validates all book IDs exist
   - Deactivates any existing active set
   - Creates new featured set
   - Creates 5 featured set items
   - Returns success

### Homepage Display Flow

1. HomePage component loads
2. Calls `getActiveFeaturedSet()` service function
3. If active set exists:
   - Displays primary book (first in set) in large featured card
   - Displays remaining 4 books in grid below
4. If no active set:
   - Falls back to showing first new release as featured

## Gemini AI Prompt Strategy

The AI prompt focuses on:
- **Recognizable books**: Titles/authors that are marketable
- **Variety**: Different genres/authors when possible
- **Price points**: Books with good pricing
- **Availability**: Books that are available to ship
- **Relevance**: Newer publications preferred

**Note**: v1 does NOT scrape retailers. It uses only inventory metadata. Future versions could add retailer context if needed.

## Security Considerations

✅ **Server-Side Only**: Gemini API key never exposed to browser
✅ **Authentication Required**: Both endpoints require valid session token
✅ **RLS Policies**: Database protected by Row Level Security
✅ **Input Validation**: All inputs validated before database writes

⚠️ **Admin Check**: Currently allows any authenticated user. Add email allowlist or role check for production.

## Troubleshooting

### "Unauthorized" Error
- Check that you're signed in
- Verify session token is being sent in Authorization header
- Check admin verification logic

### "Gemini is not configured"
- Verify `GEMINI_API_KEY` is set in Vercel environment variables
- For local dev, check `.env.local`

### "No active books in inventory"
- Ensure books exist in `books` table with `is_active = true`
- Check Supabase connection

### Homepage Not Updating
- Verify featured set was created successfully
- Check browser console for errors
- Verify `getActiveFeaturedSet()` is being called

## Future Enhancements

- [ ] Scheduled auto-generation (weekly/monthly)
- [ ] Retailer trend analysis (Amazon, B&N bestseller lists)
- [ ] Manual override (admin can manually add/remove books)
- [ ] Multiple featured sets (holiday picks, seasonal themes)
- [ ] Analytics (track which featured books convert best)



