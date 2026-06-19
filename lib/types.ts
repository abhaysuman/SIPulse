export type ChartPeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "MAX";

export type InstrumentType = "Stock" | "ETF" | "MF" | "Index" | "Other";

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: InstrumentType;
  currency?: string;
}

export interface ChartCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuoteData {
  symbol: string;
  longName: string;
  shortName: string;
  currency: string;
  exchangeName: string;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  sector: string | null;
  industry: string | null;
  totalRevenue: number | null;
  profitMargins: number | null;
}

export interface NewsItem {
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  sentiment: "Positive" | "Neutral" | "Negative";
}

export interface FinancialRow {
  period: string;
  revenue?: number | null;
  grossProfit?: number | null;
  operatingIncome?: number | null;
  netIncome?: number | null;
  totalAssets?: number | null;
  totalLiabilities?: number | null;
  shareholderEquity?: number | null;
  operatingCashFlow?: number | null;
  freeCashFlow?: number | null;
  capex?: number | null;
}

export interface FinancialsData {
  income: FinancialRow[];
  balance: FinancialRow[];
  cashflow: FinancialRow[];
}

export interface ApiError {
  error: string;
}

export interface ProjectionPoint {
  month: string;
  invested: number;
  value: number;
  realValue: number;
}

export interface IndicatorPoint {
  time: string;
  value: number;
}

export interface MacdPoint {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
}
