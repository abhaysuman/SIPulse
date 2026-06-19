# SIPulse

Single-screen stock research and SIP/lump-sum simulator built with Next.js App Router.

## Run Locally

```bash
npm.cmd run build
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
```

Open http://127.0.0.1:3000.

## Environment

Copy `.env.example` to `.env.local` and fill in keys when available.

- `NVIDIA_NIM_API_KEY`: Enables streamed deep research.
- `NVIDIA_NIM_MODEL`: Optional, defaults to `meta/llama-3.1-70b-instruct`.
- `ALPHA_VANTAGE_KEY`: Optional fallback news provider.

Yahoo Finance data uses `yahoo-finance2` and does not need an API key.

## Verified

- `npm.cmd run lint`
- `npm.cmd run test`
- `node node_modules/typescript/lib/tsc.js --noEmit`
- `npm.cmd run build`
