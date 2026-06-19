import type { QuoteData } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";

interface StockHeaderProps {
  quote: QuoteData | null;
  fallbackSymbol: string;
}

export function StockHeader({ quote, fallbackSymbol }: StockHeaderProps) {
  const price = quote?.currentPrice ?? null;
  const change = quote?.change ?? null;
  const changePercent = quote?.changePercent ?? null;
  const isUp = (change ?? 0) >= 0;
  const low = quote?.fiftyTwoWeekLow ?? null;
  const high = quote?.fiftyTwoWeekHigh ?? null;
  const rangePosition =
    price !== null && low !== null && high !== null && high > low
      ? Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100))
      : 50;

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-sm text-muted">{quote?.symbol ?? fallbackSymbol}</p>
          <h2 className="mt-1 text-2xl font-semibold">{quote?.longName ?? "Select an instrument"}</h2>
          <p className="mt-1 text-sm text-muted">
            {[quote?.exchangeName, quote?.sector, quote?.industry].filter(Boolean).join(" · ") || "Market data"}
          </p>
        </div>
        <div className="grid gap-2 text-left lg:text-right">
          <div className="font-mono text-3xl font-semibold">{formatCurrency(price, quote?.currency)}</div>
          <div className={`font-mono text-sm ${isUp ? "text-up" : "text-down"}`}>
            {change !== null ? `${isUp ? "+" : ""}${formatNumber(change)} (${formatPercent(changePercent)})` : "N/A"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="Market cap" value={formatCurrency(quote?.marketCap, quote?.currency)} />
        <Metric label="P/E ratio" value={formatNumber(quote?.trailingPE)} />
        <Metric label="Revenue" value={formatCurrency(quote?.totalRevenue, quote?.currency)} />
        <Metric
          label="Profit margin"
          value={quote?.profitMargins === null || quote?.profitMargins === undefined ? "N/A" : formatPercent(quote.profitMargins * 100)}
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between font-mono text-xs text-muted">
          <span>52W low {formatCurrency(low, quote?.currency)}</span>
          <span>52W high {formatCurrency(high, quote?.currency)}</span>
        </div>
        <div className="h-2 rounded-full bg-background">
          <div className="relative h-2 rounded-full bg-gradient-to-r from-down via-blue to-up" style={{ width: `${rangePosition}%` }}>
            <span className="absolute right-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-foreground" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}
