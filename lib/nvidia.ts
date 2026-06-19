import type { NewsItem, QuoteData } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";

export function getNvidiaConfig() {
  const apiKey = process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY || "";
  const model = process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-70b-instruct";
  return { apiKey, model, baseURL: "https://integrate.api.nvidia.com/v1" };
}

export function buildResearchPrompt(quote: QuoteData, news: NewsItem[]) {
  const headlines = news
    .slice(0, 6)
    .map((item) => `${item.title} (${item.sentiment})`)
    .join(" | ");

  return `Company: ${quote.longName} (${quote.symbol})
Currency: ${quote.currency}
Current price: ${formatCurrency(quote.currentPrice, quote.currency)}
Market cap: ${formatCurrency(quote.marketCap, quote.currency)}
Trailing P/E: ${quote.trailingPE ?? "N/A"}
Revenue: ${formatCurrency(quote.totalRevenue, quote.currency)}
Profit margin: ${formatPercent(quote.profitMargins === null ? null : quote.profitMargins * 100)}
Sector: ${quote.sector ?? "N/A"}
Industry: ${quote.industry ?? "N/A"}
Recent news: ${headlines || "No recent news found"}

Write a clear equity research brief with these sections:
1. Business overview
2. Moat assessment
3. Financial snapshot
4. Bull case
5. Bear case and risks
6. Recent news sentiment
7. Valuation view
8. SIP suitability rating from 1 to 5 stars`;
}
