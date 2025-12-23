# Kenya's Bookstore - Setup Guide

This guide covers local development setup, environment configuration, and deployment instructions.

## Framework

**Vite + React SPA** with React Router (BrowserRouter)

- Build tool: Vite
- Routing: React Router DOM (BrowserRouter for clean URLs)
- Deployment: Vercel (with SPA rewrite rules)

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

All required dependencies are already in `package.json`:
- `@supabase/supabase-js` - Supabase client
- `@stripe/stripe-js` - Stripe browser client
- `stripe` - Stripe server SDK
- `@vercel/node` - Vercel serverless function types

4. Copy environment variables:
   ```bash
   # Create .env file from .env.example
   cp .env.example .env
   ```

5. Fill in your environment variables (see Environment Variables section)

6. Start development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173` (or the port shown in terminal)

### Build

```bash
npm run build
```

Output will be in the `dist/` directory.

## Environment Variables

### Required for Full Functionality

Create a `.env` file in the root directory with the following variables:

```env
# Site Configuration
VITE_SITE_URL=http://localhost:5173

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Google Gemini API (for AI features)
GEMINI_API_KEY=your_gemini_api_key
```

### Getting API Keys

#### Supabase

1. Go to [Supabase](https://supabase.com) and create a project
2. Navigate to Project Settings → API
3. Copy the "Project URL" → `VITE_SUPABASE_URL`
4. Copy the "anon public" key → `VITE_SUPABASE_ANON_KEY`

#### Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API keys
3. Copy "Publishable key" → `VITE_STRIPE_PUBLISHABLE_KEY`
4. Copy "Secret key" → `STRIPE_SECRET_KEY`
5. For webhooks: Developers → Webhooks → Add endpoint → Copy signing secret → `STRIPE_WEBHOOK_SECRET`

#### Google Gemini

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy to `GEMINI_API_KEY`

### Environment Variable Validation

The app validates environment variables at startup:

- **Development**: Shows warnings for missing vars but doesn't crash
- **Production**: Only fails for truly critical vars when features are used

Missing vars will disable related features gracefully:
- No Supabase vars → Auth features disabled
- No Stripe vars → Payment features disabled
- No Gemini key → AI features disabled

## Supabase Authentication

### How It's Wired

1. **Client Setup**: `lib/supabaseClient.ts`
   - Creates a single Supabase client instance
   - Returns `null` if not configured (graceful fallback)

2. **Auth Context**: `context/AuthContext.tsx`
   - Provides `AuthProvider` component
   - Exposes `useAuth()` hook with:
     - `user`: Current user object
     - `session`: Current session
     - `loading`: Loading state
     - `signIn(email, password)`: Sign in method
     - `signUp(email, password)`: Sign up method
     - `signOut()`: Sign out method
     - `isAuthenticated`: Boolean flag

3. **Usage**:
   ```tsx
   import { useAuth } from '../context/AuthContext';
   
   const { user, signIn, signOut, isAuthenticated } = useAuth();
   ```

### Database

No schema assumptions are made. You'll need to create your own tables in Supabase as needed.

## Stripe Integration

### API Endpoints

All Stripe endpoints are located in `/api/` directory and deploy as Vercel Serverless Functions.

#### 1. Create Checkout Session
- **Endpoint**: `POST /api/stripe/create-checkout-session`
- **Body**:
  ```json
  {
    "priceId": "price_xxx",
    "mode": "payment" | "subscription",
    "successUrl": "https://yoursite.com/success",
    "cancelUrl": "https://yoursite.com/cancel"
  }
  ```
- **Returns**: `{ sessionId: "cs_xxx" }`
- **Stub Behavior**: Returns 501 if `STRIPE_SECRET_KEY` is not set

#### 2. Create Customer Portal Session
- **Endpoint**: `POST /api/stripe/create-portal-session`
- **Body**:
  ```json
  {
    "customerId": "cus_xxx",
    "returnUrl": "https://yoursite.com/account/billing"
  }
  ```
- **Returns**: `{ url: "https://billing.stripe.com/..." }`
- **Stub Behavior**: Returns 501 if `STRIPE_SECRET_KEY` is not set

#### 3. Stripe Webhook
- **Endpoint**: `POST /api/stripe/webhook`
- **Headers**: Requires `stripe-signature` header
- **Behavior**:
  - Verifies webhook signature if `STRIPE_WEBHOOK_SECRET` is set
  - Returns 501 if not configured
  - Handles events: `checkout.session.completed`, `customer.subscription.updated`, `payment_intent.succeeded`
- **Stub Behavior**: Returns 501 if `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` is not set

### Frontend Integration

- **Pricing Page**: `/pricing` (placeholder structure)
- **Billing Page**: `/account/billing` (shows "Coming soon" if Stripe not configured)

### Notes

- **No products/plans created in code**: You must create products and prices in Stripe Dashboard
- **No hardcoded price IDs**: All price IDs must be passed from frontend
- **Webhook signature verification**: Only works if `STRIPE_WEBHOOK_SECRET` is set

## Vercel Deployment

### SPA Routing

The `vercel.json` file includes rewrite rules for React Router:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures:
- API routes (`/api/*`) are handled by serverless functions
- All other routes serve `index.html` for client-side routing

### Deployment Steps

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - **Important**: Use `VITE_` prefix for client-side vars
   - Server-side vars (like `STRIPE_SECRET_KEY`) don't need `VITE_` prefix
4. Deploy

### Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Security Headers

The `vercel.json` includes baseline security headers:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`

## Troubleshooting

### Routes Not Working

- Ensure `vercel.json` is in the root directory
- Check that rewrite rules are correct
- Verify you're using `BrowserRouter` (not `HashRouter`)

### API Endpoints Return 501

- Check that environment variables are set in Vercel dashboard
- Verify server-side vars (like `STRIPE_SECRET_KEY`) don't have `VITE_` prefix
- Check function logs in Vercel dashboard

### Supabase Auth Not Working

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check browser console for warnings
- Ensure Supabase project is active

### Build Fails

- Check that all dependencies are in `package.json`
- Verify TypeScript types are installed (`@types/node`, etc.)
- Check for missing imports or syntax errors

## Next Steps

1. **Content**: Fill in placeholder pages (Privacy, Terms, Returns, Shipping, FAQ)
2. **Database**: Create Supabase tables for orders, users, etc.
3. **Stripe Products**: Create products and prices in Stripe Dashboard
4. **Webhooks**: Configure webhook endpoint in Stripe Dashboard
5. **Testing**: Test checkout flow, auth flow, and webhook handling

## Support

For questions or issues, please contact the development team or refer to:
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

