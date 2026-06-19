export function currencySymbol(currency?: string | null) {
  if (currency === "INR") return "₹";
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
  if (currency === "JPY") return "¥";
  return "$";
}

export function formatCurrency(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  const symbol = currencySymbol(currency);

  if (currency === "INR") {
    if (Math.abs(value) >= 1e7) return `${symbol}${(value / 1e7).toFixed(2)} Cr`;
    if (Math.abs(value) >= 1e5) return `${symbol}${(value / 1e5).toFixed(2)} L`;
    return `${symbol}${Math.round(value).toLocaleString("en-IN")}`;
  }

  if (Math.abs(value) >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
  if (Math.abs(value) >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;

  return `${symbol}${value.toLocaleString("en-US", {
    maximumFractionDigits: value < 100 ? 2 : 0,
  })}`;
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(2)}%`;
}

export function formatRelativeDate(dateLike: string | null | undefined) {
  if (!dateLike) return "Recent";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "Recent";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function inputCurrencyPrefix(currency?: string | null) {
  return currency === "INR" ? "₹" : currencySymbol(currency);
}
