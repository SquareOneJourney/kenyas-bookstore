# Quick Scan Setup Guide

The Quick Scan feature allows you to quickly add books to inventory by scanning or entering an ISBN. It automatically fetches book data from Google Books and enriches it with AI-generated content.

## How It Works

1. **Click "Quick Scan"** button on the Inventory Management page
2. **Choose scanning method**:
   - **Camera Scanner**: Click "Open Camera Scanner" to use your device's camera to scan the ISBN barcode
   - **Manual Entry**: Type the ISBN directly into the input field
3. The system will:
   - Fetch basic book data from Google Books API (free, no key needed)
   - Enrich with AI-generated description, tags, and pricing estimate
   - Optionally check Ingram stock and wholesale pricing
4. **Review and adjust** the book details
5. **Save to Inventory**

## Setup Requirements

### 1. Google Books API ✅ (Already Working)
- **Status**: No setup needed - uses public API
- The Google Books API is free and doesn't require authentication for basic queries
- Already configured and working

### 2. Gemini AI API (For Enrichment)
- **Status**: Requires API key
- **Purpose**: Generates book descriptions, tags, and pricing estimates
- **Setup Steps**:
  1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Add to your environment variables:
     - **Development**: Create `.env.local` file in project root
     - **Production**: Add to your hosting platform (Vercel, etc.)
  3. Add the key:
     ```
     VITE_GEMINI_API_KEY=your_api_key_here
     ```
  4. Restart your development server

**Note**: Currently the code uses `process.env.API_KEY` which needs to be updated to use Vite's `import.meta.env.VITE_GEMINI_API_KEY` for client-side access, or moved to a server-side API route for security.

### 3. Ingram API (Optional - Currently Mocked)
- **Status**: Currently using mock data
- **Purpose**: Check real-time stock levels and wholesale pricing for drop-ship items
- **Setup Steps** (for production):
  1. Sign up for Ingram Content Group API access
  2. Get OAuth2 Client Credentials
  3. Update `services/ingramService.ts` with real API endpoints
  4. Add credentials to environment variables:
     ```
     INGRAM_CLIENT_ID=your_client_id
     INGRAM_CLIENT_SECRET=your_client_secret
     ```

## Current Limitations

1. **API Key Access**: The Gemini API key is currently accessed via `process.env.API_KEY` which won't work in Vite. This needs to be:
   - Changed to `import.meta.env.VITE_GEMINI_API_KEY` for client-side, OR
   - Moved to a server-side API route (recommended for security)

2. **Ingram Integration**: Currently returns mock data. Real integration requires:
   - Ingram API credentials
   - OAuth2 authentication setup
   - Proper error handling

## Mobile Usage

The Quick Scan feature is now mobile-friendly:
- ✅ **Camera Barcode Scanning**: Use your phone's camera to scan ISBN barcodes directly
- ✅ Responsive form layout
- ✅ Touch-friendly buttons
- ✅ Optimized spacing for small screens
- ✅ Horizontal scrolling for tables (if needed)

### Camera Scanner Features
- Automatically detects and uses the back camera on mobile devices
- Supports ISBN-10 and ISBN-13 barcode formats
- Real-time scanning with visual feedback
- Automatic ISBN validation and cleaning
- Works on both mobile and desktop (if camera available)

## Troubleshooting

### "Book not found" error
- Verify the ISBN is correct (try ISBN-10 or ISBN-13 format)
- Check your internet connection
- Google Books API may not have the book in their database

### AI enrichment not working
- Check that `VITE_GEMINI_API_KEY` is set in your environment
- Verify the API key is valid and has quota remaining
- Check browser console for errors

### Ingram data not showing
- Currently returns mock data - this is expected
- Real Ingram integration requires API credentials setup

## Security Note

⚠️ **Important**: Exposing API keys in client-side code is a security risk. For production, consider:
- Moving Gemini API calls to a server-side API route
- Using environment variables that are only accessible server-side
- Implementing rate limiting and authentication

