# APRO

This website is a static Vite + React app and is ready to deploy on Cloudflare Pages.

## Build

```bash
npm install
npm run build
```

Production output is generated in `dist/`.

## Cloudflare Pages Setup

Point Cloudflare Pages at this `APRO` folder and use:

- Build command: `npm run build`
- Build output directory: `dist`

## Environment Variables

Set these production variables in Cloudflare Pages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Development-only variables currently present in the project:

- `GEMINI_API_KEY`
- `VITE_API_URL`

## Routing

The app uses `HashRouter`, so it does not rely on Netlify redirect rules for client-side routing.
