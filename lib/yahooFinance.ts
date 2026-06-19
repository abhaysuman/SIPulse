import YahooFinance from "yahoo-finance2";
import Sentiment from "sentiment";
import type { ChartCandle, ChartPeriod, FinancialRow, FinancialsData, NewsItem, QuoteData, SearchResult } from "@/lib/types";

type SourceRecord = Record<string, unknown>;

const sentiment = new Sentiment();
const yahooFinance = new YahooFinance();

function asRecord(value: unknown): SourceRecord {
  return value && typeof value === "object" ? (value as SourceRecord) : {};
}

function asArray(value: unknown): SourceRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const record = asRecord(value);
  const raw = record.raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return null;
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  const record = asRecord(value);
  if (typeof record.fmt === "string" && record.fmt.trim()) return record.fmt;
  return null;
}

function dateValue(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  const raw = numberValue(value);
  return raw ? new Date(raw * 1000).toISOString() : null;
}

function sentimentTag(title: string): NewsItem["sentiment"] {
  const score = sentiment.analyze(title).score;
  if (score > 2) return "Positive";
  if (score < -2) return "Negative";
  return "Neutral";
}

function toInstrumentType(value: unknown): SearchResult["type"] {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("etf")) return "ETF";
  if (text.includes("mutual") || text.includes("fund")) return "MF";
  if (text.includes("index")) return "Index";
  if (text.includes("equity") || text.includes("stock")) return "Stock";
  return "Other";
}

function periodStart(period: ChartPeriod) {
  const date = new Date();
  switch (period) {
    case "1W":
      date.setDate(date.getDate() - 7);
      break;
    case "1M":
      date.setMonth(date.getMonth() - 1);
      break;
    case "3M":
      date.setMonth(date.getMonth() - 3);
      break;
    case "6M":
      date.setMonth(date.getMonth() - 6);
      break;
    case "1Y":
      date.setFullYear(date.getFullYear() - 1);
      break;
    case "3Y":
      date.setFullYear(date.getFullYear() - 3);
      break;
    case "MAX":
      return new Date("1970-01-01T00:00:00.000Z");
  }
  return date;
}

export async function searchInstruments(query: string): Promise<SearchResult[]> {
  const result = asRecord(await yahooFinance.search(query, { newsCount: 0, quotesCount: 8 }));
  return asArray(result.quotes)
    .map((item) => ({
      symbol: stringValue(item.symbol) ?? "",
      name: stringValue(item.longname) ?? stringValue(item.shortname) ?? stringValue(item.name) ?? "",
      exchange: stringValue(item.exchDisp) ?? stringValue(item.exchange) ?? "",
      type: toInstrumentType(item.quoteType ?? item.typeDisp),
      currency: stringValue(item.currency) ?? undefined,
    }))
    .filter((item) => item.symbol);
}

export async function getChartData(symbol: string, period: ChartPeriod): Promise<ChartCandle[]> {
  const interval = period === "3Y" || period === "MAX" ? "1wk" : "1d";
  const result: { date: Date; open?: number; high?: number; low?: number; close?: number; volume?: number }[] =
    await yahooFinance.historical(symbol, {
    period1: periodStart(period),
    period2: new Date(),
    interval,
  });

  return result
    .map((item: { date: Date; open?: number; high?: number; low?: number; close?: number; volume?: number }) => ({
      time: item.date.toISOString().slice(0, 10),
      open: Number(item.open ?? item.close ?? 0),
      high: Number(item.high ?? item.close ?? 0),
      low: Number(item.low ?? item.close ?? 0),
      close: Number(item.close ?? 0),
      volume: Number(item.volume ?? 0),
    }))
    .filter((item) => item.close > 0)
    .sort((a: ChartCandle, b: ChartCandle) => a.time.localeCompare(b.time));
}

export async function getQuoteData(symbol: string): Promise<QuoteData> {
  const [summaryResult, quoteResult] = await Promise.allSettled([
    yahooFinance.quoteSummary(symbol, {
      modules: ["price", "summaryDetail", "defaultKeyStatistics", "assetProfile", "financialData"],
    }),
    yahooFinance.quote(symbol),
  ]);

  const summary = summaryResult.status === "fulfilled" ? asRecord(summaryResult.value) : {};
  const quote = quoteResult.status === "fulfilled" ? asRecord(quoteResult.value) : {};
  const price = asRecord(summary.price);
  const detail = asRecord(summary.summaryDetail);
  const profile = asRecord(summary.assetProfile);
  const financialData = asRecord(summary.financialData);

  const currentPrice =
    numberValue(price.regularMarketPrice) ?? numberValue(quote.regularMarketPrice) ?? numberValue(quote.postMarketPrice);
  const previousClose = numberValue(detail.previousClose) ?? numberValue(quote.regularMarketPreviousClose);
  const change =
    numberValue(price.regularMarketChange) ??
    numberValue(quote.regularMarketChange) ??
    (currentPrice !== null && previousClose !== null ? currentPrice - previousClose : null);
  const changePercent =
    numberValue(price.regularMarketChangePercent) ??
    numberValue(quote.regularMarketChangePercent) ??
    (change !== null && previousClose ? (change / previousClose) * 100 : null);

  return {
    symbol,
    longName: stringValue(price.longName) ?? stringValue(quote.longName) ?? stringValue(quote.shortName) ?? symbol,
    shortName: stringValue(price.shortName) ?? stringValue(quote.shortName) ?? symbol,
    currency: stringValue(price.currency) ?? stringValue(quote.currency) ?? "USD",
    exchangeName: stringValue(price.exchangeName) ?? stringValue(quote.fullExchangeName) ?? stringValue(quote.exchange) ?? "",
    currentPrice,
    previousClose,
    change,
    changePercent,
    marketCap: numberValue(price.marketCap) ?? numberValue(quote.marketCap),
    trailingPE: numberValue(detail.trailingPE) ?? numberValue(quote.trailingPE),
    fiftyTwoWeekLow: numberValue(detail.fiftyTwoWeekLow) ?? numberValue(quote.fiftyTwoWeekLow),
    fiftyTwoWeekHigh: numberValue(detail.fiftyTwoWeekHigh) ?? numberValue(quote.fiftyTwoWeekHigh),
    sector: stringValue(profile.sector),
    industry: stringValue(profile.industry),
    totalRevenue: numberValue(financialData.totalRevenue),
    profitMargins: numberValue(financialData.profitMargins),
  };
}

async function alphaNews(symbol: string): Promise<NewsItem[]> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) return [];

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "NEWS_SENTIMENT");
  url.searchParams.set("tickers", symbol);
  url.searchParams.set("limit", "10");
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url);
  if (!response.ok) return [];
  const json = asRecord(await response.json());

  return asArray(json.feed).map((item) => {
    const title = stringValue(item.title) ?? "Untitled";
    return {
      title,
      url: stringValue(item.url) ?? "#",
      publisher: stringValue(item.source) ?? "Alpha Vantage",
      publishedAt: dateValue(item.time_published),
      sentiment: sentimentTag(title),
    };
  });
}

export async function getNewsData(symbol: string): Promise<NewsItem[]> {
  const result = asRecord(await yahooFinance.search(symbol, { quotesCount: 0, newsCount: 10 }));
  const news = asArray(result.news).map((item) => {
    const title = stringValue(item.title) ?? "Untitled";
    return {
      title,
      url: stringValue(item.link) ?? stringValue(item.url) ?? "#",
      publisher: stringValue(item.publisher) ?? stringValue(item.source) ?? "Yahoo Finance",
      publishedAt: dateValue(item.providerPublishTime ?? item.published_at),
      sentiment: sentimentTag(title),
    };
  });

  if (news.length > 0) return news;
  return alphaNews(symbol);
}

function statementRows(container: unknown, key: string): SourceRecord[] {
  const record = asRecord(container);
  return asArray(record[key]);
}

function periodLabel(row: SourceRecord) {
  const date = dateValue(row.endDate);
  if (!date) return "Period";
  return new Date(date).getFullYear().toString();
}

export async function getFinancialsData(symbol: string): Promise<FinancialsData> {
  const summary = asRecord(
    await yahooFinance.quoteSummary(symbol, {
      modules: ["incomeStatementHistory", "balanceSheetHistory", "cashflowStatementHistory"],
    }),
  );

  const income: FinancialRow[] = statementRows(summary.incomeStatementHistory, "incomeStatementHistory")
    .slice(0, 5)
    .map((row) => ({
      period: periodLabel(row),
      revenue: numberValue(row.totalRevenue),
      grossProfit: numberValue(row.grossProfit),
      operatingIncome: numberValue(row.operatingIncome),
      netIncome: numberValue(row.netIncome),
    }));

  const balance: FinancialRow[] = statementRows(summary.balanceSheetHistory, "balanceSheetStatements")
    .slice(0, 5)
    .map((row) => ({
      period: periodLabel(row),
      totalAssets: numberValue(row.totalAssets),
      totalLiabilities: numberValue(row.totalLiab),
      shareholderEquity: numberValue(row.totalStockholderEquity),
    }));

  const cashflow: FinancialRow[] = statementRows(summary.cashflowStatementHistory, "cashflowStatements")
    .slice(0, 5)
    .map((row) => {
      const operatingCashFlow = numberValue(row.totalCashFromOperatingActivities) ?? numberValue(row.operatingCashflow);
      const capex = numberValue(row.capitalExpenditures);
      return {
        period: periodLabel(row),
        operatingCashFlow,
        capex,
        freeCashFlow: operatingCashFlow !== null && capex !== null ? operatingCashFlow + capex : null,
      };
    });

  return { income: income.reverse(), balance: balance.reverse(), cashflow: cashflow.reverse() };
}
