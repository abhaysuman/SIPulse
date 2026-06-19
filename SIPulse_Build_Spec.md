# SIPulse — Build Specification
## Single-Screen Stock & SIP Research + Simulator Web App
**For Codex / AI Coding Agent Use**

---

## What This Is

A single-screen web app where a user searches for any stock or mutual fund globally, gets a rich chart with overlays, runs a deep-research analysis powered by an LLM, and simulates SIP/lump-sum investment outcomes over custom time horizons. Deployable to Vercel for free. No paid APIs required at launch.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Vercel-native, zero config deploy |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, accessible |
| Charts | Lightweight Charts (TradingView OSS) | Best-in-class OHLCV rendering, free forever |
| Financial Data | Yahoo Finance (via `yahoo-finance2` npm package) | Free, no API key, covers global equities + Indian MFs |
| LLM | NVIDIA NIM API (free tier, `meta/llama-3.1-70b-instruct`) | Free credits, OpenAI-compatible API |
| News | Yahoo Finance news (bundled in `yahoo-finance2`) + Alpha Vantage free tier (50 calls/day) | Zero cost |
| State | React `useState` / `useReducer` — no external state library | Keeps bundle small |
| API Routes | Next.js `/app/api/` route handlers | All external calls stay server-side; hides API keys |

---

## Free API Setup

### 1. Yahoo Finance (`yahoo-finance2`)
No API key. Install the npm package. All calls go through Next.js API routes to avoid CORS.

```bash
npm install yahoo-finance2
```

### 2. NVIDIA NIM API (LLM)
Sign up at `build.nvidia.com`. Free tier gives $25 credits, enough for hundreds of deep-research calls.

- Base URL: `https://integrate.api.nvidia.com/v1`
- Model: `meta/llama-3.1-70b-instruct`
- API key env var: `NVIDIA_NIM_API_KEY`

### 3. Alpha Vantage (fallback news + fundamentals)
Register at `alphavantage.co` — free tier, 25 requests/day (no card needed).

- Env var: `ALPHA_VANTAGE_KEY`

---

## Project Structure

```
sipulse/
├── app/
│   ├── page.tsx                   # Single screen — the entire UI lives here
│   ├── layout.tsx                 # Root layout, fonts, metadata
│   └── api/
│       ├── search/route.ts        # Ticker search autocomplete
│       ├── chart/route.ts         # OHLCV historical data
│       ├── quote/route.ts         # Current price + fundamentals
│       ├── news/route.ts          # Latest news for ticker
│       ├── financials/route.ts    # Income statement, balance sheet, cash flow
│       └── research/route.ts     # Streams LLM deep research response
├── components/
│   ├── SearchBar.tsx              # Global ticker search with autocomplete
│   ├── ChartPanel.tsx             # TradingView Lightweight Charts wrapper
│   ├── StockHeader.tsx            # Price, change, 52w range, market cap
│   ├── ResearchPanel.tsx          # LLM research output (streamed markdown)
│   ├── SimulatorPanel.tsx         # SIP / lump-sum simulator + projection chart
│   ├── FinancialsPanel.tsx        # Revenue, profit, debt tables
│   └── NewsPanel.tsx              # News cards with sentiment tag
├── lib/
│   ├── yahooFinance.ts            # Wrapper around yahoo-finance2 calls
│   ├── nvidia.ts                  # NVIDIA NIM streaming helper
│   └── calculations.ts            # SIP math, CAGR, XIRR
├── .env.local                     # API keys (never committed)
└── vercel.json                    # Optional: set function timeout to 60s
```

---

## Screen Layout

Single scrollable screen. No routing. No tabs that hide content.

```
┌─────────────────────────────────────────────────────┐
│  [ SIPulse ]          [ 🔍 Search any stock/SIP... ] │  ← Fixed top bar
├─────────────────────────────────────────────────────┤
│                                                       │
│  AAPL  $213.45  ▲ 1.2%   NASDAQ   Market Cap: $3.2T │  ← StockHeader
│                                                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  [ 1W ] [ 1M ] [ 3M ] [ 6M ] [ 1Y ] [ 3Y ] [ MAX ]  │  ← Period selector
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │                                               │   │
│  │          TradingView Lightweight Chart        │   │
│  │          (Candlestick + Volume bars)          │   │  ← ChartPanel (h: 420px)
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  Overlays:  [ SMA 50 ] [ SMA 200 ] [ RSI ] [ MACD ]  │  ← Toggle overlays
│                                                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──── Deep Research ──────────────────────────────┐ │
│  │  [ 🔬 Run Deep Research ]                        │ │
│  │                                                   │ │  ← ResearchPanel
│  │  Streamed markdown output from NVIDIA LLM        │ │
│  │  (business overview, moat, risks, outlook,       │ │
│  │   recent news sentiment, valuation snapshot)     │ │
│  └──────────────────────────────────────────────────┘│
│                                                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──── SIP / Lump-Sum Simulator ───────────────────┐ │
│  │                                                   │ │
│  │  Investment Type:  ● SIP   ○ Lump Sum             │ │
│  │  Monthly Amount:   [ ₹5,000    ▲▼ ]               │ │
│  │  Duration:         [ 10 Years  ▲▼ ]               │ │
│  │  Expected Return:  [ Auto (Historical CAGR) ▼ ]   │ │  ← SimulatorPanel
│  │  Start Date:       [ Jan 2024  ▲▼ ]               │ │
│  │                                                    │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │  Projected Growth Chart (Area chart)        │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │  Invested: ₹6,00,000  │  Est. Returns: ₹9,12,400  │ │
│  │  Total Value: ₹15,12,400  │  CAGR: 12.4%          │ │
│  └──────────────────────────────────────────────────┘│
│                                                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──── Financials ─────────────────────────────────┐ │
│  │  [ Revenue ] [ P&L ] [ Balance Sheet ] [ Cash ]   │ │  ← FinancialsPanel
│  │  Bar charts + data table (last 5 years)           │ │
│  └──────────────────────────────────────────────────┘│
│                                                       │
│  ┌──── Latest News ────────────────────────────────┐ │
│  │  Card per article: headline, source, date,        │ │  ← NewsPanel
│  │  sentiment tag (Positive / Neutral / Negative)    │ │
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## Component Specifications

### `SearchBar.tsx`

- Input calls `/api/search?q={query}` on every keystroke (debounced 300ms).
- Dropdown shows up to 8 results: ticker symbol, company name, exchange, type (Stock / ETF / MF).
- On select: sets global `activeTicker` state, triggers all data fetches in parallel.
- Supports Indian tickers: NSE format `RELIANCE.NS`, BSE format `RELIANCE.BO`.
- Keyboard navigable (arrow keys + Enter).

**API Route `/api/search/route.ts`:**
```typescript
import yahooFinance from 'yahoo-finance2';
const results = await yahooFinance.search(q, { newsCount: 0, quotesCount: 8 });
return Response.json(results.quotes);
```

---

### `ChartPanel.tsx`

Uses `lightweight-charts` from TradingView (MIT license, free).

```bash
npm install lightweight-charts
```

**Chart features:**
- Candlestick series as default view.
- Volume histogram on a separate pane below.
- Period selector buttons: 1W, 1M, 3M, 6M, 1Y, 3Y, MAX.
- Overlay toggles: SMA 50 (blue line), SMA 200 (orange line), RSI pane (separate), MACD pane.
- Auto dark/light theme sync with system preference.
- Crosshair tooltip showing OHLCV values.
- Responsive — fills container width, fixed 420px height.

**SMA Calculation (done client-side):**
```typescript
function sma(data: {time: string, value: number}[], period: number) {
  return data.map((d, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return { time: d.time, value: slice.reduce((s, x) => s + x.value, 0) / period };
  }).filter(Boolean);
}
```

**API Route `/api/chart/route.ts`:**
```typescript
import yahooFinance from 'yahoo-finance2';
const result = await yahooFinance.historical(ticker, {
  period1: startDate,   // computed from period param (1W, 1M, etc.)
  period2: new Date(),
  interval: period === '1W' || period === '1M' ? '1d' : period === '3Y' || period === 'MAX' ? '1wk' : '1d'
});
// Return array of { time: 'YYYY-MM-DD', open, high, low, close, volume }
```

---

### `StockHeader.tsx`

Displays below the search bar, above the chart.

Fields pulled from `/api/quote`:
- Company name + ticker symbol
- Current price (large, bold)
- Price change (absolute + %) with colour (green up, red down)
- Exchange name
- Market cap (formatted: ₹ or $, with T/B/M suffix)
- P/E ratio
- 52-week high/low range with a visual bar showing where current price sits
- Sector + Industry

**API Route `/api/quote/route.ts`:**
```typescript
const quote = await yahooFinance.quoteSummary(ticker, {
  modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'assetProfile']
});
```

---

### `ResearchPanel.tsx`

A collapsible panel with a "Run Deep Research" button.

**On button click:**
1. Calls `/api/research?ticker={ticker}` as a streaming `fetch`.
2. Shows a loading skeleton that fills with streamed markdown text in real time.
3. Uses `marked` or `react-markdown` to render the streamed output.

**What the LLM generates (prompt structure in `/api/research/route.ts`):**

The system prompt instructs the model to produce a structured deep-research brief covering:
- Business overview (2–3 sentences, plain English)
- Competitive moat assessment
- Key financial metrics snapshot (revenue growth trend, operating margin, debt level — pulled from context)
- Bull case (3 points max)
- Bear case / key risks (3 points max)
- Recent news sentiment summary
- Valuation: current P/E vs sector average, cheap / fair / expensive verdict
- SIP suitability rating: 1–5 stars with one-sentence reasoning

**API Route `/api/research/route.ts`:**
```typescript
import OpenAI from 'openai'; // NVIDIA NIM is OpenAI-compatible

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_NIM_API_KEY,
});

// Fetch fundamentals and recent news first (pass as context to the LLM)
const [quote, news] = await Promise.all([
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/quote?ticker=${ticker}`).then(r => r.json()),
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/news?ticker=${ticker}`).then(r => r.json()),
]);

const contextBlock = `
  Company: ${quote.longName} (${ticker})
  Current Price: ${quote.currentPrice}
  Market Cap: ${quote.marketCap}
  P/E: ${quote.trailingPE}
  Revenue (TTM): ${quote.totalRevenue}
  Profit Margin: ${quote.profitMargins}
  Recent News Headlines: ${news.map(n => n.title).slice(0, 5).join(' | ')}
`;

const stream = await client.chat.completions.create({
  model: 'meta/llama-3.1-70b-instruct',
  max_tokens: 1000,
  stream: true,
  messages: [
    { role: 'system', content: 'You are a senior equity research analyst. Write in clear, direct prose. No filler.' },
    { role: 'user', content: `Write a deep research brief for this stock:\n\n${contextBlock}` }
  ]
});

// Stream response back to client using ReadableStream
const readable = new ReadableStream({ ... });
return new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } });
```

---

### `SimulatorPanel.tsx`

The core feature. Completely client-side once historical data is loaded.

**Inputs:**
- Investment Type: SIP (monthly) or Lump Sum (radio)
- Monthly Amount (for SIP) or One-time Amount (for lump sum): number input with ₹/$ prefix, step 500
- Duration: slider or number input, 1–40 years
- Expected Return Mode: dropdown with three options:
  - **Auto (Historical CAGR)** — calculated from the chart data already loaded
  - **Manual** — user enters a % rate
  - **Conservative / Moderate / Aggressive** — presets at 8% / 12% / 16%
- Start Date: month + year picker (defaults to today)

**Output metrics (update live as inputs change):**
- Total Amount Invested
- Estimated Returns (gains only)
- Total Corpus Value
- Effective CAGR
- Inflation-adjusted real value (assumes 6% inflation, toggleable)

**Projection chart:**
A second `lightweight-charts` area chart (not candlestick) showing:
- Line 1 (grey): Total Invested over time (straight diagonal for lump sum, staircase for SIP)
- Line 2 (green): Projected corpus value over time

**SIP Math (`lib/calculations.ts`):**
```typescript
export function sipFutureValue(monthlyAmount: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12; // monthly rate
  const n = years * 12;             // total months
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

export function lumpSumFutureValue(principal: number, annualRate: number, years: number): number {
  return principal * Math.pow(1 + annualRate / 100, years);
}

export function historicalCAGR(prices: {close: number}[], years: number): number {
  const start = prices[0].close;
  const end = prices[prices.length - 1].close;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

export function xirr(cashflows: {date: Date, amount: number}[]): number {
  // Newton-Raphson XIRR implementation
  // Returns annualised return rate for irregular cashflows (for backtest mode)
}
```

**Backtesting mode (bonus feature, same panel):**
A toggle: "Show Historical Backtest". When on, instead of projecting forward, it shows what would have actually happened if the user had started a SIP in the past (e.g., Jan 2015) with their entered amount. Uses real historical price data already loaded. Shows actual corpus vs invested over the actual period.

---

### `FinancialsPanel.tsx`

Four sub-tabs: Revenue, P&L, Balance Sheet, Cash Flow.

Each tab shows:
- A bar chart (use `recharts` — already lightweight, easy to integrate)
- A data table below with last 5 annual periods

```bash
npm install recharts
```

**API Route `/api/financials/route.ts`:**
```typescript
const result = await yahooFinance.quoteSummary(ticker, {
  modules: ['incomeStatementHistory', 'balanceSheetHistory', 'cashflowStatementHistory']
});
```

Key metrics to display:
- Revenue, Gross Profit, Operating Income, Net Income (P&L)
- Total Assets, Total Liabilities, Shareholders Equity (Balance Sheet)
- Operating Cash Flow, Free Cash Flow, CapEx (Cash Flow)

Note: Quarterly data is available via `incomeStatementHistoryQuarterly` for Indian stocks on NSE/BSE.

---

### `NewsPanel.tsx`

Grid of news cards (2 columns on desktop, 1 on mobile).

Each card shows:
- Headline (linked to original article)
- Source name
- Published date (relative: "2 hours ago")
- Sentiment tag: colour-coded badge

**Sentiment tagging:** Pass headline text to a lightweight local sentiment check. Do NOT call the LLM for this — use the `sentiment` npm package (pure JS, zero API calls).

```bash
npm install sentiment
```

```typescript
import Sentiment from 'sentiment';
const analyzer = new Sentiment();
const result = analyzer.analyze(headline);
const tag = result.score > 2 ? 'Positive' : result.score < -2 ? 'Negative' : 'Neutral';
```

**API Route `/api/news/route.ts`:**
```typescript
const result = await yahooFinance.search(ticker, { quotesCount: 0, newsCount: 10 });
return Response.json(result.news);
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
NVIDIA_NIM_API_KEY=nvapi-xxxxxxxxxxxxxxxx
ALPHA_VANTAGE_KEY=your_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

On Vercel, add the same keys in Project Settings → Environment Variables. Change `NEXT_PUBLIC_BASE_URL` to your production domain.

---

## Vercel Configuration

Create `vercel.json` at root:

```json
{
  "functions": {
    "app/api/research/route.ts": {
      "maxDuration": 60
    },
    "app/api/financials/route.ts": {
      "maxDuration": 30
    }
  }
}
```

The free Vercel Hobby plan supports 60-second function timeouts. All other routes finish well within 10 seconds.

---

## Visual Design Spec

**Theme:** Dark by default, system preference respected via `prefers-color-scheme`.

**Colour tokens:**

| Token | Dark | Light |
|---|---|---|
| Background | `#0a0a0f` | `#f8f8fc` |
| Surface | `#13131a` | `#ffffff` |
| Border | `#1e1e2e` | `#e2e2ec` |
| Text primary | `#e8e8f0` | `#12121a` |
| Text muted | `#6b6b8a` | `#5a5a7a` |
| Accent up (green) | `#00c896` | `#00a878` |
| Accent down (red) | `#ff4d6a` | `#d93250` |
| Accent blue (SMA50) | `#4d9eff` | `#1a7fe0` |
| Accent orange (SMA200) | `#ff8c42` | `#d96e1a` |

**Typography:**

- Display / headings: `Inter` (Google Fonts, free)
- Monospace numbers (prices, metrics): `JetBrains Mono` or `Geist Mono`
- Body: `Inter`

Apply via `next/font` for zero layout shift:
```typescript
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
```

**Chart theme** (pass to `lightweight-charts` `createChart`):
```typescript
const chartOptions = {
  layout: {
    background: { color: '#0a0a0f' },
    textColor: '#6b6b8a',
  },
  grid: {
    vertLines: { color: '#1e1e2e' },
    horzLines: { color: '#1e1e2e' },
  },
  crosshair: { mode: CrosshairMode.Normal },
};
```

---

## Data Flow Summary

```
User types ticker
      │
      ▼
SearchBar → /api/search → yahoo-finance2.search()
      │
      ▼ (user selects)
activeTicker set in page.tsx state
      │
      ├──→ /api/chart?ticker=X&period=1Y  → yahoo-finance2.historical()  → ChartPanel
      ├──→ /api/quote?ticker=X            → yahoo-finance2.quoteSummary() → StockHeader + SimulatorPanel (CAGR)
      ├──→ /api/news?ticker=X             → yahoo-finance2.search()       → NewsPanel
      └──→ /api/financials?ticker=X       → yahoo-finance2.quoteSummary() → FinancialsPanel

User clicks "Run Deep Research"
      │
      ▼
/api/research?ticker=X
      ├── fetches /api/quote + /api/news (server-side, internal)
      └── NVIDIA NIM streaming → streamed to ResearchPanel
```

All `/api/*` routes run server-side. The browser never touches Yahoo Finance directly or sends any API key.

---

## Build Steps for Codex

Run these in order:

```bash
# 1. Scaffold
npx create-next-app@latest sipulse --typescript --tailwind --eslint --app
cd sipulse

# 2. Dependencies
npm install yahoo-finance2 lightweight-charts recharts sentiment openai
npm install -D @types/sentiment

# 3. shadcn/ui setup
npx shadcn@latest init
# Choose: Default style, Zinc colour, yes to CSS variables

# 4. Add shadcn components used
npx shadcn@latest add badge button card separator slider tabs

# 5. Create environment file
cp .env.example .env.local
# Then fill in keys
```

---

## Error Handling Rules

- If Yahoo Finance returns no data for a ticker (e.g., invalid symbol), show an inline error inside the relevant panel, not a full page error.
- If NVIDIA NIM fails (rate limit or key missing), show a static fallback message: "Deep research unavailable. Check your NVIDIA NIM API key in .env.local."
- If `financials` returns empty arrays (common for small-cap or Indian MFs), hide the FinancialsPanel and show "Fundamental data not available for this instrument."
- All API routes wrap in try/catch and return `{ error: string }` with appropriate HTTP status codes (404 for not found, 500 for server error, 429 for rate limit).
- Client components check for `data.error` before rendering and show a shadcn `Alert` component.

---

## Indian Market Specifics

Yahoo Finance supports Indian equities and mutual funds with these ticker formats:

| Type | Format | Example |
|---|---|---|
| NSE Stock | `{SYMBOL}.NS` | `RELIANCE.NS` |
| BSE Stock | `{SYMBOL}.BO` | `RELIANCE.BO` |
| NSE Index | `^NSEI` | Nifty 50 |
| BSE Index | `^BSESN` | Sensex |
| Mutual Fund | Full ISIN or fund name search | Search returns fund object |

The `SimulatorPanel` should detect the currency from `quote.currency` and display `₹` for INR or `$` for USD automatically. Format large numbers in Indian lakh/crore system when currency is INR:

```typescript
export function formatIndian(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
```

---

## Performance Notes

- Do not import `yahoo-finance2` in any client component. It runs only in API routes (Node.js runtime).
- `lightweight-charts` renders via canvas — no hydration issues, but wrap in a `useEffect` with a ref to mount after the DOM is ready.
- Debounce the search input at 300ms to avoid hammering the search endpoint.
- Cache API route responses where appropriate using Next.js `revalidate`:
  - Chart data: `export const revalidate = 3600` (1 hour)
  - Quote data: `export const revalidate = 60` (1 minute)
  - Financials: `export const revalidate = 86400` (24 hours)
  - News: `export const revalidate = 1800` (30 minutes)
- Research route: no caching (streaming, always fresh).

---

## What Is Not Included (Intentional Scope Cuts)

- No user authentication — this is a personal tool.
- No portfolio tracking or watchlist persistence (add localStorage later if needed).
- No real-time WebSocket price feed — Yahoo Finance's free data is 15-min delayed, which is fine for SIP planning.
- No PDF export of research — add later with `jspdf` if needed.
- No mobile-first responsive redesign beyond basic Tailwind breakpoints — the chart needs minimum 480px width to be useful.

---

## Deployment Checklist

1. Push to GitHub.
2. Connect repo to Vercel.
3. Add environment variables in Vercel dashboard: `NVIDIA_NIM_API_KEY`, `ALPHA_VANTAGE_KEY`, `NEXT_PUBLIC_BASE_URL` (set to your production URL).
4. Deploy. Free Hobby plan covers this entirely — no paid Vercel plan needed.
5. Test with `RELIANCE.NS`, `HDFCBANK.NS`, and `AAPL` to confirm NSE, BSE, and US equities all work.

---

*Document version: 1.0 — June 2026*
