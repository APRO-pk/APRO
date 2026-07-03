# APRO

This website is a static Vite + React app and is ready to deploy on Cloudflare.

## Build

```bash
npm install
npm run build
```

Production output is generated in `dist/`.

## Cloudflare Setup

This repo now includes [wrangler.jsonc](/F:/APRO/apro-hub/APRO/wrangler.jsonc) for Cloudflare Workers Builds / static asset deployment.

Point Cloudflare at this `APRO` folder and use:

- Build command: `npm run build`

Cloudflare will read the built output from `dist` through the Wrangler config.

## Environment Variables

Set these production variables in Cloudflare Pages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Development-only variables currently present in the project:

- `GEMINI_API_KEY`
- `VITE_API_URL`

## Routing

The app currently uses `HashRouter`, so route refreshes already work without server-side path handling. The Wrangler SPA fallback is still configured for future flexibility.
