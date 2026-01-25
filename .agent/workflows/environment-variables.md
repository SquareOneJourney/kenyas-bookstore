---
description: Critical rules for environment variables and API keys in this project
---

# Environment Variable Rules for Kenya's Bookstore

## ⚠️ CRITICAL: GEMINI API KEY

**DO NOT** use `VITE_GEMINI_API_KEY` or any `VITE_` prefixed key for Gemini.

**ALWAYS** use `GEMINI_API_KEY` (or `GOOGLE_API_KEY` as fallback).

### Why?

This project uses **Vercel Serverless Functions** (`/api/*.ts`) for all AI operations. These functions run on the **server**, not the browser.

- Server-side code accesses environment variables via `process.env.GEMINI_API_KEY`
- The `VITE_` prefix is **only** for variables that need to be exposed to the **browser/client**
- We do NOT expose the Gemini key to the browser for security reasons

### Correct Usage

```typescript
// In /api/*.ts files (Serverless Functions)
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
```

### Incorrect Usage (NEVER DO THIS)

```typescript
// ❌ WRONG - This is for browser-side code
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

## Project Architecture Summary

| Layer | Location | Env Access | Example Key |
|-------|----------|------------|-------------|
| Frontend (Vite) | `components/`, `pages/` | `import.meta.env.VITE_*` | `VITE_SUPABASE_URL` |
| Backend (Vercel) | `api/*.ts` | `process.env.*` | `GEMINI_API_KEY` |

## Vercel Configuration

The `vercel.json` file explicitly routes `/api/*` to serverless functions. This is required for `process.env` to work correctly.

```json
{
  "framework": "vite",
  "functions": { "api/**/*.ts": { ... } },
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

## Before Making Changes

1. **Check this file first** before touching any AI/Gemini related code
2. **Never suggest VITE_GEMINI_API_KEY** - it will never work and is insecure
3. **All Gemini calls go through `/api/ai/*.ts`** - the frontend just calls these endpoints
